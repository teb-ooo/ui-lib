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

  it("`when.field` shows an action only while the selection holds that value (one value or a list)", () => {
    const staged = {
      paths: {
        "/api/proposals/{id}/apply": {
          post: { operationId: "apply-proposal", "x-palette": { title: "Apply {name}", group: "Proposal", when: { route: "/p", field: { status: "staged" } }, args: { id: "selection.id" } } },
        },
        "/api/proposals/{id}/withdraw": {
          post: { operationId: "withdraw-proposal", "x-palette": { title: "Withdraw {name}", group: "Proposal", when: { route: "/p", field: { status: ["open", "staged"] } }, args: { id: "selection.id" } } },
        },
      },
    };
    const at = (status: string | null) => commandsFromSpec(staged, { route: "/p", params: {}, selection: status === null ? null : { id: "1", name: "rb-1", status } }, runtime()).map((c) => c.title);
    expect(at("staged")).toEqual(["Apply rb-1", "Withdraw rb-1"]);
    expect(at("open")).toEqual(["Withdraw rb-1"]);
    expect(at("applied")).toEqual([]);
    expect(at(null)).toEqual([]);
    expect(paletteProblems(staged)).toEqual([]);
    const bad = { paths: { "/x": { post: { operationId: "x", "x-palette": { title: "X", group: "G", when: { field: { status: [] } } } } } } };
    expect(paletteProblems(bad as never).join()).toContain("when.field.status");
  });

  it("`when.differs` keeps an action off the signed-in person's own row", () => {
    const d = { paths: { "/api/users/{id}/disable": { post: { operationId: "disable-user", "x-palette": { title: "Disable {name}", group: "Users", when: { route: "/users", differs: { id: "user.subject" } }, args: { id: "selection.id" } } } } } };
    const at = (id: string, user: Record<string, unknown> | null) => commandsFromSpec(d, { route: "/users", params: {}, selection: { id, name: "ada" }, user }, runtime()).map((c) => c.title);
    expect(at("7", { subject: "9" })).toEqual(["Disable ada"]);
    expect(at("9", { subject: "9" })).toEqual([]);
    expect(at("7", null)).toEqual([]);
    expect(paletteProblems(d)).toEqual([]);
    const bad = { paths: { "/x": { post: { operationId: "x", "x-palette": { title: "X", group: "G", when: { differs: { id: "me" } } } } } } };
    expect(paletteProblems(bad as never).join()).toContain("when.differs.id");
  });

  it("`role` hides an action and a source from anyone it is not for, and while nobody is signed in", () => {
    const d = {
      paths: {
        "/api/users/{id}/disable": { post: { operationId: "disable-user", "x-palette": { title: "Disable {name}", group: "Users", role: "admin", when: { route: "/users" }, args: { id: "selection.id" } } } },
        "/api/rules/{code}": { delete: { operationId: "retire-rule", "x-palette": { title: "Retire {code}", group: "Rule", role: "owner", args: { code: "selection.code" } } } },
        "/api/users": { get: { operationId: "list-users", "x-palette": { role: "admin", source: { group: "Users", title: "{name}", route: "/users/{id}" } } } },
      },
    };
    const sel = { id: "1", name: "ada", code: "R1" };
    const titles = (user: Record<string, unknown> | null) => commandsFromSpec(d, { route: "/users", params: {}, selection: sel, user }, runtime()).map((c) => c.title);
    expect(titles(null)).toEqual([]);
    expect(titles({ is_admin: false })).toEqual([]);
    expect(titles({ is_admin: true })).toEqual(["Disable ada"]);
    expect(titles({ is_owner: true })).toEqual(["Disable ada", "Retire R1"]); // the owner is an administrator too
    expect(commandsFromSpec(d, { route: "/x", params: {}, selection: sel, user: { is_owner: true } }, runtime()).map((c) => c.title)).toEqual(["Retire R1"]);
    expect(sourcesFromSpec(d, runtime(), null)).toHaveLength(0);
    expect(sourcesFromSpec(d, runtime(), { is_admin: true })).toHaveLength(1);
    expect(paletteProblems(d)).toEqual([]);
    const bad = { paths: { "/x": { post: { operationId: "x", "x-palette": { title: "X", group: "G", role: "root" } } } } };
    expect(paletteProblems(bad as never).join()).toContain("role must be");
  });

  it("fills arguments from route parameters and asks to confirm a DELETE by default", async () => {
    const rt = runtime({ confirm: vi.fn(() => false) });
    const [cmd] = commandsFromSpec(doc, { route: "/rule/$code", params: { code: "UI-yze" }, selection: null }, rt);
    expect(cmd?.title).toBe("Retire this rule");
    await cmd?.run?.({ query: "", fallback: false, close: () => undefined, afterClose: () => undefined });
    expect(rt.confirm).toHaveBeenCalledWith("Retire this rule?", { danger: true });
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
    expect(rt.confirm).toHaveBeenCalledWith("Disable ada?", { danger: false });
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
    expect(problems.some((p) => p.includes("cannot ask for id") && p.includes("no JSON request body"))).toBe(true);
    expect(problems.some((p) => p.includes("needs an operationId"))).toBe(true);
    expect(problems.some((p) => p.includes("neither an action"))).toBe(true);
    expect(untaggedActions(doc)).toEqual(["POST /api/untagged (untagged)"]);
  });
});
