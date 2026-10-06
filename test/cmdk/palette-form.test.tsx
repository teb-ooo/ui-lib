import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@teb-ooo/web";
import { commandsFromSpec, PaletteFromApi, paletteProblems } from "../../src/cmdk/index";
import type { OpenApiDocument, PaletteRuntime } from "../../src/cmdk/index";
import { renderApp } from "./harness";

const spec: OpenApiDocument = {
  paths: {
    "/api/rules": {
      post: {
        operationId: "create-rule",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/NewRule" } } } },
        "x-palette": {
          title: "Create a rule",
          group: "Rules",
          when: { route: "/rules" },
          args: { code: "prompt", title: "prompt", kind: "prompt", weight: "prompt", strict: "prompt", notes: "prompt" },
          form: { submit: "Create rule" },
          after: { invalidate: ["/api/rules"] },
        },
      },
    },
  },
  components: {
    schemas: {
      NewRule: {
        type: "object",
        required: ["code", "title"],
        properties: {
          code: { type: "string", minLength: 3, description: "Short and stable." },
          title: { type: "string", title: "Rule title" },
          kind: { type: "string", enum: ["must", "should"] },
          weight: { type: "integer", minimum: 1 },
          strict: { type: "boolean" },
          notes: { type: "string", maxLength: 2000 },
        },
      },
    },
  },
};

const here = { route: "/rules", params: {} };
function runtime(over: Partial<PaletteRuntime> = {}): PaletteRuntime {
  return { call: vi.fn(async () => ({})), confirm: vi.fn(() => true), invalidate: vi.fn(), navigate: vi.fn(), ...over };
}

describe("commandsFromSpec with prompt arguments", () => {
  it("asks for the fields in the tag's order, built from the body schema, and runs the action with the answers", async () => {
    const prompt = vi.fn(async (request: Parameters<NonNullable<PaletteRuntime["prompt"]>>[0]) => {
      await request.submit({ code: "UI-1", title: "T", weight: 2, strict: true });
    });
    const rt = runtime({ prompt });
    const [cmd] = commandsFromSpec(spec, here, rt);
    expect(cmd?.title).toBe("Create a rule");
    await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined });
    const request = prompt.mock.calls[0]![0];
    expect(request.submitLabel).toBe("Create rule");
    expect(request.fields.map((f) => [f.name, f.label, f.kind, f.required])).toEqual([
      ["code", "Code", "text", true],
      ["title", "Rule title", "text", true],
      ["kind", "Kind", "select", false],
      ["weight", "Weight", "integer", false],
      ["strict", "Strict", "boolean", false],
      ["notes", "Notes", "multiline", false],
    ]);
    expect(request.fields[0]?.description).toBe("Short and stable.");
    expect(request.fields[2]?.options).toEqual(["must", "should"]);
    expect(rt.confirm).not.toHaveBeenCalled();
    expect(rt.call).toHaveBeenCalledWith({ operationId: "create-rule", method: "post", path: "/api/rules", args: { code: "UI-1", title: "T", weight: 2, strict: true } });
    expect(rt.invalidate).toHaveBeenCalledWith(["/api/rules"]);
  });

  it("fails clearly when the palette has no form step", async () => {
    const [cmd] = commandsFromSpec(spec, here, runtime());
    await expect(cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined })).rejects.toThrow(/no form step/u);
  });

  it("paletteProblems refuses what a form cannot ask for, and accepts what it can", () => {
    expect(paletteProblems(spec)).toEqual([]);
    const tag = (args: Record<string, string>, extra: object = {}) => ({
      paths: { "/api/x": { post: { operationId: "x", ...extra, "x-palette": { title: "X", group: "G", args } } } },
      components: { schemas: { B: { type: "object", properties: { n: { type: "string" }, list: { type: "array", items: { type: "string" } }, obj: { type: "object" } } } } },
    });
    const body = { requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/B" } } } } };
    expect(paletteProblems(tag({ n: "prompt" }, body) as OpenApiDocument)).toEqual([]);
    expect(paletteProblems(tag({ list: "prompt" }, body) as OpenApiDocument).join()).toContain("not a single value");
    expect(paletteProblems(tag({ obj: "prompt" }, body) as OpenApiDocument).join()).toContain("not a single value");
    expect(paletteProblems(tag({ nope: "prompt" }, body) as OpenApiDocument).join()).toContain("not a property");
    expect(paletteProblems(tag({ n: "prompt" }) as OpenApiDocument).join()).toContain("no JSON request body");
  });
});

describe("the form step in PaletteFromApi", () => {
  async function start(call: PaletteRuntime["call"]) {
    const user = userEvent.setup();
    await renderApp({
      initialPath: "/rules",
      routes: [{ path: "/rules" }],
      extra: (
        <QueryClientProvider client={new QueryClient()}>
          <PaletteFromApi spec={spec} call={call} />
        </QueryClientProvider>
      ),
    });
    await user.click(screen.getByRole("button", { name: "Open command palette" }));
    await user.click(await screen.findByRole("option", { name: /Create a rule/ }));
    const dialog = await screen.findByRole("dialog", { name: "Create a rule" });
    return { user, dialog };
  }

  it("shows the fields, refuses an empty submit with the validator's messages, then submits typed answers and closes", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => ({}));
    const { user, dialog } = await start(call);
    expect(within(dialog).getByLabelText("Code")).toBeTruthy();
    expect(within(dialog).getByText("Short and stable.")).toBeTruthy();
    expect(within(dialog).getByLabelText("Notes (optional)")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Create rule" }));
    expect((await within(dialog).findAllByText("Required.")).length).toBe(2);
    expect(call).not.toHaveBeenCalled();
    await user.type(within(dialog).getByLabelText("Code"), "UI-9");
    await user.type(within(dialog).getByLabelText("Rule title"), "Be kind");
    await user.type(within(dialog).getByLabelText("Weight (optional)"), "3");
    await user.click(within(dialog).getByRole("checkbox", { name: "Strict (optional)" }));
    await user.click(within(dialog).getByRole("button", { name: "Create rule" }));
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "create-rule", method: "post", path: "/api/rules", args: { code: "UI-9", title: "Be kind", weight: 3, strict: true } }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Create a rule" })).toBeNull());
  });

  it("keeps the form open with the server's field error under its field", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => {
      throw new ApiError({ status: 422, title: "Unprocessable", errors: [{ location: "body.code", message: "code already exists" }] });
    });
    const { user, dialog } = await start(call);
    await user.type(within(dialog).getByLabelText("Code"), "UI-9");
    await user.type(within(dialog).getByLabelText("Rule title"), "Be kind");
    await user.click(within(dialog).getByRole("button", { name: "Create rule" }));
    expect(await within(dialog).findByText("code already exists")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Create a rule" })).toBeTruthy();
  });

  it("says a sentence, never the raw message, when the call fails without a field", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => {
      throw new Error("pg: connection refused");
    });
    const { user, dialog } = await start(call);
    await user.type(within(dialog).getByLabelText("Code"), "UI-9");
    await user.type(within(dialog).getByLabelText("Rule title"), "Be kind");
    await user.click(within(dialog).getByRole("button", { name: "Create rule" }));
    const alert = await within(dialog).findByRole("alert");
    expect(alert.textContent).not.toContain("pg:");
    expect(screen.getByRole("dialog", { name: "Create a rule" })).toBeTruthy();
  });

  it("Cancel closes without calling the operation", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => ({}));
    const { user, dialog } = await start(call);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Create a rule" })).toBeNull());
    expect(call).not.toHaveBeenCalled();
  });
});
