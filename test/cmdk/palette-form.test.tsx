import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@teb-ooo/web";
import { commandsFromSpec, PaletteFromApi, paletteProblems } from "../../src/cmdk/index";
import type { CommandForm, OpenApiDocument, PaletteRuntime } from "../../src/cmdk/index";
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
  it("returns a form built from the body schema, in the tag's order, and its submit runs the action with the answers", async () => {
    const rt = runtime();
    const [cmd] = commandsFromSpec(spec, here, rt);
    expect(cmd?.title).toBe("Create a rule");
    const out = (await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined })) as { form: CommandForm };
    const request = out.form;
    expect(request.title).toBe("Create a rule");
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
    expect(rt.call).not.toHaveBeenCalled(); // nothing runs until the review is submitted
    await request.submit({ code: "UI-1", title: "T", weight: 2, strict: true });
    expect(rt.call).toHaveBeenCalledWith({ operationId: "create-rule", method: "post", path: "/api/rules", args: { code: "UI-1", title: "T", weight: 2, strict: true } });
    expect(rt.invalidate).toHaveBeenCalledWith(["/api/rules"]);
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

describe("the form step inside the palette", () => {
  async function start(call: PaletteRuntime["call"], doc: OpenApiDocument = spec, name: RegExp = /Create a rule/) {
    const user = userEvent.setup();
    await renderApp({
      initialPath: "/rules",
      routes: [{ path: "/rules" }],
      extra: (
        <QueryClientProvider client={new QueryClient()}>
          <PaletteFromApi spec={doc} call={call} />
        </QueryClientProvider>
      ),
    });
    await user.click(screen.getByRole("button", { name: "Open command palette" }));
    await user.click(await screen.findByRole("option", { name }));
    return user;
  }
  const field = (label: string) => screen.findByRole("combobox", { name: label });
  const type = async (user: ReturnType<typeof userEvent.setup>, label: string, text: string) => {
    await user.type(await field(label), `${text}{Enter}`);
  };

  it("steps through the fields in the palette's own input, then reviews and submits typed answers", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => ({}));
    const user = await start(call);
    // No dialog opens over the palette: the palette itself is the form.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toContain("Create a rule");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" }).textContent).toContain("Code (1/6)");
    expect(screen.getByText(/Code · 1 of 6 · Short and stable\./u)).toBeTruthy();
    await user.keyboard("{Enter}"); // required and empty
    expect(await screen.findByRole("alert")).toHaveTextContent("Required.");
    await type(user, "Code", "UI-9");
    await type(user, "Rule title", "Be kind");
    // kind: a list of the schema's enum, chosen from rows (Skip is offered: it is optional)
    expect(await screen.findByRole("option", { name: "Skip" })).toBeTruthy();
    await user.click(screen.getByRole("option", { name: "must" }));
    await type(user, "Weight", "3");
    await user.click(await screen.findByRole("option", { name: "Yes" })); // strict: yes or no
    await user.keyboard("{Enter}"); // notes: optional, empty skips
    // the review: the submit row first, then every answer, changeable
    expect(await screen.findByRole("option", { name: "Create rule" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Code: UI-9/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Strict: Yes/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Notes: skipped/ })).toBeTruthy();
    expect(call).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "create-rule", method: "post", path: "/api/rules", args: { code: "UI-9", title: "Be kind", kind: "must", weight: 3, strict: true } }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("refuses an answer the schema refuses, under the input, and a text that is not a number", async () => {
    const user = await start(vi.fn<PaletteRuntime["call"]>(async () => ({})));
    await type(user, "Code", "ab"); // minLength 3
    expect(await screen.findByRole("alert")).toHaveTextContent("Use at least 3 characters.");
    await user.clear(await field("Code"));
    await type(user, "Code", "UI-9");
    await type(user, "Rule title", "T");
    await user.click(await screen.findByRole("option", { name: "Skip" })); // kind
    await type(user, "Weight", "abc");
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a number.");
  });

  it("Backspace on an empty input goes back a step with its answer; at the first step it leaves the form", async () => {
    const user = await start(vi.fn<PaletteRuntime["call"]>(async () => ({})));
    await type(user, "Code", "UI-9");
    await field("Rule title");
    await user.keyboard("{Backspace}");
    expect(((await field("Code")) as HTMLInputElement).value).toBe("UI-9");
    await user.clear(await field("Code"));
    await user.keyboard("{Backspace}");
    expect(await screen.findByRole("option", { name: /Create a rule/ })).toBeTruthy(); // back at the commands
  });

  it("a review answer can be changed and returns to the review", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => ({}));
    const user = await start(call);
    await type(user, "Code", "UI-9");
    await type(user, "Rule title", "Old");
    for (let i = 0; i < 4; i++) await user.keyboard("{Enter}"); // kind (skip is the first row), weight, strict, notes
    await user.click(await screen.findByRole("option", { name: /Rule title: Old/ }));
    const input = (await field("Rule title")) as HTMLInputElement;
    expect(input.value).toBe("Old");
    await user.clear(input);
    await user.type(input, "New{Enter}");
    await user.click(await screen.findByRole("option", { name: /Rule title: New/ }));
    expect(((await field("Rule title")) as HTMLInputElement).value).toBe("New");
  });

  it("takes the person back to the field the server names, with its message", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => {
      throw new ApiError({ status: 422, title: "Unprocessable", errors: [{ location: "body.code", message: "code already exists" }] });
    });
    const user = await start(call);
    await type(user, "Code", "UI-9");
    await type(user, "Rule title", "T");
    for (let i = 0; i < 4; i++) await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "Create rule" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("code already exists");
    expect(((await field("Code")) as HTMLInputElement).value).toBe("UI-9");
  });

  it("says a sentence, never the raw message, when the call fails without a field, and stays on the review", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async () => {
      throw new Error("pg: connection refused");
    });
    const user = await start(call);
    await type(user, "Code", "UI-9");
    await type(user, "Rule title", "T");
    for (let i = 0; i < 4; i++) await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "Create rule" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toContain("pg:");
    expect(screen.getByRole("option", { name: "Create rule" })).toBeTruthy();
  });
});

describe("form.fields, form.options and the field kinds", () => {
  const proposal: OpenApiDocument = {
    paths: {
      "/api/apps": { get: { operationId: "list-apps" } },
      "/api/proposals": {
        post: {
          operationId: "create-proposal",
          requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/NewProposal" } } } },
          "x-palette": {
            title: "New proposal",
            group: "Proposals",
            when: { route: "/rules" },
            args: { description: "prompt", scope: "prompt", title: "prompt", email: "prompt" },
            form: { submit: "Create", fields: ["scope", "title", "description"], options: { scope: { from: "list-apps", value: "name", label: "label", also: ["platform"] } } },
          },
        },
      },
    },
    components: {
      schemas: {
        NewProposal: {
          type: "object",
          required: ["scope", "title"],
          properties: {
            description: { type: "string", maxLength: 5000 },
            scope: { type: "string" },
            title: { type: "string" },
            email: { type: "string", format: "email", maxLength: 254 },
          },
        },
      },
    },
  };

  const go = async (call: PaletteRuntime["call"]) => {
    const user = userEvent.setup();
    await renderApp({
      initialPath: "/rules",
      routes: [{ path: "/rules" }],
      extra: (
        <QueryClientProvider client={new QueryClient()}>
          <PaletteFromApi spec={proposal} call={call} />
        </QueryClientProvider>
      ),
    });
    await user.click(screen.getByRole("button", { name: "Open command palette" }));
    await user.click(await screen.findByRole("option", { name: /New proposal/ }));
    return user;
  };

  it("asks in form.fields order, then the rest in key order; a long free text is a box, an email is one line", async () => {
    const [cmd] = commandsFromSpec(proposal, here, runtime());
    const out = (await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined })) as { form: CommandForm };
    const fields = out.form.fields;
    expect(fields.map((f) => f.name)).toEqual(["scope", "title", "description", "email"]);
    expect(fields.find((f) => f.name === "description")?.kind).toBe("multiline"); // maxLength 5000, no format
    expect(fields.find((f) => f.name === "email")).toMatchObject({ kind: "text", format: "email" }); // maxLength 254 stays one line
  });

  it("offers a list operation's items as the rows of a step, the fixed ones first, and sends the chosen value", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async (c) => (c.operationId === "list-apps" ? { items: [{ name: "ah", label: "Dashboard" }, { name: "bd", label: "Work tracker" }, { name: 3 }] } : {}));
    const user = await go(call);
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "list-apps", method: "get", path: "/api/apps", args: { limit: "100" } }));
    await waitFor(() => expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["platform", "Dashboard", "Work tracker"])); // the fixed item first
    await user.type(await screen.findByRole("combobox", { name: "Scope" }), "work"); // typing filters the rows
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Work tracker"]);
    await user.click(screen.getByRole("option", { name: "Work tracker" }));
    await user.type(await screen.findByRole("combobox", { name: "Title" }), "A proposal{Enter}");
    await user.keyboard("{Enter}"); // description: optional, skipped
    await user.keyboard("{Enter}"); // email: optional, skipped
    await user.click(await screen.findByRole("option", { name: "Create" }));
    await waitFor(() => expect(call).toHaveBeenCalledWith({ operationId: "create-proposal", method: "post", path: "/api/proposals", args: { scope: "bd", title: "A proposal" } }));
  });

  it("falls back to typing when the choices cannot be loaded", async () => {
    const call = vi.fn<PaletteRuntime["call"]>(async (c) => {
      if (c.operationId === "list-apps") throw new Error("down");
      return {};
    });
    await go(call);
    expect(await screen.findByPlaceholderText("Scope")).toBeTruthy();
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("paletteProblems checks the order list and the option sources", () => {
    expect(paletteProblems(proposal)).toEqual([]);
    const tag = (form: object) => ({ ...proposal, paths: { ...proposal.paths, "/api/proposals": { post: { ...proposal.paths!["/api/proposals"]!.post!, "x-palette": { ...(proposal.paths!["/api/proposals"]!.post!["x-palette"] as object), form } } } } }) as OpenApiDocument;
    expect(paletteProblems(tag({ fields: ["nope"] })).join()).toContain("form.fields names nope");
    expect(paletteProblems(tag({ options: { nope: { from: "list-apps", value: "name" } } })).join()).toContain("form.options names nope");
    expect(paletteProblems(tag({ options: { scope: { from: "create-proposal", value: "name" } } })).join()).toContain("must be a GET operation");
    expect(paletteProblems(tag({ options: { scope: { from: "list-apps", value: "" } } })).join()).toContain("needs a value property");
  });
});
