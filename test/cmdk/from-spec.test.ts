import { describe, expect, it, vi } from "vitest";
import { commandsFromSpec, paletteProblems, runCommandSource, sourcesFromSpec, untaggedActions } from "../../src/cmdk";
import type { OpenApiDocument, PaletteRuntime } from "../../src/cmdk";
import { buildPaletteModel } from "../../src/cmdk";

const doc: OpenApiDocument = {
  paths: {
    "/api/people": {
      get: { operationId: "list-people", "x-palette": { source: { group: "People", title: "{username}", hint: "{status}", route: "/users?person={id}" } } },
    },
    "/api/people/{id}/disable": {
      post: { operationId: "disable-person", "x-palette": { title: "Disable {person}", group: "People", when: { route: "/users", needs: "selection" }, args: { id: "selection.id" }, confirm: "Disable {person}?", after: { invalidate: ["/api/people"] } } },
    },
    "/api/rules/{code}": {
      delete: { operationId: "retire-rule", "x-palette": { title: "Retire this rule", group: "Rule", when: { route: "/rule/$code" }, args: { code: "route.code" }, after: { navigate: "/rules" } } },
    },
    "/api/notes/{id}/rename": {
      post: { operationId: "rename-note", "x-palette": { title: "Rename note", group: "Notes", args: { id: "route.id" } } },
    },
    "/api/ping": { post: { operationId: "ping", "x-palette": false } },
    "/api/untagged": { post: { operationId: "untagged" } },
  },
};

function runtime(over: Partial<PaletteRuntime> = {}): PaletteRuntime {
  return { call: vi.fn(async () => ({})), confirm: vi.fn(() => true), invalidate: vi.fn(), navigate: vi.fn(), ...over };
}
const ctx = { route: "/users", params: {}, selection: { id: "7", person: "ada" } };

describe("commandsFromSpec", () => {
  it("shows an action only where its `when` matches, with the title filled from the selection", () => {
    const here = commandsFromSpec(doc, ctx, runtime());
    expect(here.map((c) => c.title)).toEqual(["Disable ada"]);
    expect(commandsFromSpec(doc, { ...ctx, selection: null }, runtime())).toEqual([]);
    expect(commandsFromSpec(doc, { ...ctx, route: "/other" }, runtime())).toEqual([]);
  });

  it("fills arguments from route parameters and asks to confirm a DELETE by default", async () => {
    const rt = runtime({ confirm: vi.fn(() => false) });
    const [cmd] = commandsFromSpec(doc, { route: "/rule/$code", params: { code: "UI-yze" }, selection: null }, rt);
    expect(cmd?.title).toBe("Retire this rule");
    await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined });
    expect(rt.confirm).toHaveBeenCalledWith("Retire this rule?");
    expect(rt.call).not.toHaveBeenCalled();
    const ok = runtime();
    const [cmd2] = commandsFromSpec(doc, { route: "/rule/$code", params: { code: "UI-yze" }, selection: null }, ok);
    await cmd2?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined });
    expect(ok.call).toHaveBeenCalledWith({ operationId: "retire-rule", method: "delete", path: "/api/rules/{code}", args: { code: "UI-yze" } });
    expect(ok.navigate).toHaveBeenCalledWith("/rules");
  });

  it("confirms with the tag's question, calls the operation, then invalidates", async () => {
    const rt = runtime();
    const [cmd] = commandsFromSpec(doc, ctx, rt);
    await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined });
    expect(rt.confirm).toHaveBeenCalledWith("Disable ada?");
    expect(rt.call).toHaveBeenCalledWith({ operationId: "disable-person", method: "post", path: "/api/people/{id}/disable", args: { id: "7" } });
    expect(rt.invalidate).toHaveBeenCalledWith(["/api/people"]);
  });

  it("hides a command whose argument cannot be filled, and gives one with no `when` a two-character threshold", () => {
    const rt = runtime();
    const list = commandsFromSpec(doc, { route: "/notes/$id", params: {}, selection: null }, rt);
    expect(list.find((c) => c.title === "Rename note")).toBeUndefined();
    const withId = commandsFromSpec(doc, { route: "/notes/$id", params: { id: "n1" }, selection: null }, rt);
    const rename = withId.find((c) => c.title === "Rename note");
    expect(rename?.minChars).toBe(2);
    const empty = buildPaletteModel({ query: "", commands: withId, recents: [], root: true });
    expect(empty.rows).toHaveLength(0);
    const typed = buildPaletteModel({ query: "ren", commands: withId, recents: [], root: true });
    expect(typed.rows.map((r) => r.command.title)).toEqual(["Rename note"]);
  });
});

describe("sourcesFromSpec", () => {
  it("builds a source that asks the list operation and turns items into navigate commands", async () => {
    const rt = runtime({ call: vi.fn(async () => ({ items: [{ id: "a b", username: "ada", status: "active" }, { id: "x" }] })) });
    const [source] = sourcesFromSpec(doc, rt);
    expect(source?.group).toBe("People");
    const found = await runCommandSource(source!, "ad");
    expect(rt.call).toHaveBeenCalledWith(expect.objectContaining({ operationId: "list-people", args: { q: "ad", limit: "8" } }));
    expect(found.map((c) => [c.title, c.hint])).toEqual([["ada", "active"]]);
    await found[0]?.run?.({ query: "ad", fallback: false, close: () => undefined, afterClose: () => undefined });
    expect(rt.navigate).toHaveBeenCalledWith("/users?person=a%20b");
  });
});

describe("paletteProblems and untaggedActions", () => {
  it("refuses a malformed tag and lists the actions with no tag", () => {
    expect(paletteProblems(doc)).toEqual([]);
    const bad: OpenApiDocument = {
      paths: {
        "/a": { get: { operationId: "g", "x-palette": { title: "x", group: "y" } } },
        "/b": { post: { operationId: "p", "x-palette": { title: "x", group: "y", args: { id: "prompt" } } } },
        "/c": { post: { "x-palette": { title: "x", group: "y" } } },
        "/d": { post: { operationId: "d", "x-palette": { nope: 1 } } },
      },
    };
    const problems = paletteProblems(bad);
    expect(problems.some((p) => p.includes("must change something"))).toBe(true);
    expect(problems.some((p) => p.includes("not supported yet"))).toBe(true);
    expect(problems.some((p) => p.includes("needs an operationId"))).toBe(true);
    expect(problems.some((p) => p.includes("neither an action"))).toBe(true);
    expect(untaggedActions(doc)).toEqual(["POST /api/untagged (untagged)"]);
  });
});
