import type { Command } from "./types";
import type { CommandSource } from "./sources";

/** A value a `when.field` condition compares the selection's field with. */
export type PaletteScalar = string | number | boolean;

/**
 * What an operation says about the palette (`x-palette` in the OpenAPI document). Two kinds: an action (a mutating
 * operation that becomes a command) and a source (a list or search operation the palette searches while typing).
 * `x-palette: false` says the operation deliberately has no command.
 */
export interface PaletteActionTag {
  /** Verb-first title; `{name}` is filled from the selection, then the route parameters. A command with an unfilled name is hidden. */
  title: string;
  group: string;
  /**
   * Where it applies: the router's route pattern (`/rule/$code`), whether a selected row is needed, and what that row
   * must hold: `field: { status: "staged" }` (or a list of accepted values) shows the command only while the published
   * selection has that value, so "Apply" appears only for a staged proposal. `field` implies `needs: "selection"`.
   * With no `when` the command shows only once two characters are typed.
   */
  when?: {
    route?: string;
    needs?: "selection";
    field?: Record<string, PaletteScalar | readonly PaletteScalar[]>;
    /**
     * Fields of the selection that must differ from a value of the signed-in person (`user.<field>`, such as `user.subject`)
     * or of the route (`route.<param>`): `differs: { id: "user.subject" }` keeps "Disable {user}" off the person's own row.
     * A reference that does not resolve (nobody signed in, no such param) leaves the command out.
     */
    differs?: Record<string, string>;
  };
  /** Each path, query or body field: `route.<param>`, `selection.<field>`, or a literal. (`prompt` arrives with phase 2.) */
  args?: Record<string, string>;
  /** `true` asks "<title>?"; a string is the question (`{name}` filled as in the title). A DELETE asks by default; `false` turns that off. */
  confirm?: boolean | string;
  /** After a success: refetch lists whose address starts with these, and/or go to a route. */
  after?: { invalidate?: string[]; navigate?: string };
  hint?: string;
  keywords?: string[];
  /** Only for these people: `admin` (an administrator or the app's owner) or `owner`. Hidden for everyone else, and while nobody is signed in. */
  role?: PaletteRole;
}

export type PaletteRole = "admin" | "owner";

function hasRole(role: PaletteRole | undefined, user: Record<string, unknown> | null | undefined): boolean {
  if (role === undefined) return true;
  if (!user) return false;
  return role === "owner" ? user.is_owner === true : user.is_admin === true || user.is_owner === true;
}

export interface PaletteSourceTag {
  /** Only for these people, as on an action: a search the API would answer 403 is never asked for anyone else. */
  role?: PaletteRole;
  source: {
    group: string;
    /** `{field}` is filled from each result. */
    title: string;
    hint?: string;
    /** Where choosing a result goes: `{field}` is filled, URL-encoded. */
    route: string;
    /** The list operation's query parameter. @default "q" */
    param?: string;
    /** @default 2 */
    minChars?: number;
    /** Most results. @default 8 */
    limit?: number;
  };
}

export type PaletteTag = PaletteActionTag | PaletteSourceTag | false;

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  "x-palette"?: unknown;
}
export interface OpenApiDocument {
  paths?: Record<string, Record<string, OpenApiOperation | undefined> | undefined>;
}

/** One call of an operation: the app's client (or `paletteFetch`) turns it into a request. */
export interface PaletteCall {
  operationId: string;
  method: string;
  /** The path template, such as `/api/people/{id}`. */
  path: string;
  /** Path parameters, query parameters and body fields by name. */
  args: Record<string, string>;
  signal?: AbortSignal;
}

/** Where the person is: the matched route pattern, its parameters, and the selected row a screen published. */
export interface PaletteContext {
  route: string;
  params: Record<string, string>;
  selection?: Record<string, unknown> | null;
  /** The signed-in person (`useUser().user`), for `when.differs`. */
  user?: Record<string, unknown> | null;
}

/** How a command acts. `PaletteFromApi` supplies the real one; tests pass fakes. */
export interface PaletteRuntime {
  call: (call: PaletteCall) => Promise<unknown>;
  /** Asks before an action; `danger` for a destructive one (a DELETE). */
  confirm: (message: string, options?: { danger?: boolean }) => boolean | Promise<boolean>;
  invalidate: (prefixes: readonly string[]) => void;
  navigate: (to: string) => void;
}

const METHODS = ["get", "post", "put", "patch", "delete"];

interface Found {
  method: string;
  path: string;
  op: OpenApiOperation;
  tag: PaletteTag | undefined;
}

function operations(doc: OpenApiDocument): Found[] {
  const found: Found[] = [];
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of METHODS) {
      const op = item?.[method];
      if (op) found.push({ method, path, op, tag: op["x-palette"] as PaletteTag | undefined });
    }
  }
  return found;
}

function isSource(tag: PaletteTag | undefined): tag is PaletteSourceTag {
  return typeof tag === "object" && tag !== null && "source" in tag;
}
function isAction(tag: PaletteTag | undefined): tag is PaletteActionTag {
  return typeof tag === "object" && tag !== null && "title" in tag;
}

/** Everything wrong with the tags of a document, one line each: for a test that refuses a malformed tag. */
export function paletteProblems(doc: OpenApiDocument): string[] {
  const out: string[] = [];
  for (const { method, path, op, tag } of operations(doc)) {
    const where = `${method.toUpperCase()} ${path} (${op.operationId ?? "no operationId"})`;
    if (tag === undefined || tag === false) continue;
    if (op.operationId === undefined) out.push(`${where}: an x-palette tag needs an operationId`);
    if (isSource(tag)) {
      if (method !== "get") out.push(`${where}: a source must be a GET`);
      const s = tag.source;
      if (!s.group || !s.title || !s.route) out.push(`${where}: a source needs group, title and route`);
      if (tag.role !== undefined && tag.role !== "admin" && tag.role !== "owner") out.push(`${where}: role must be "admin" or "owner"`);
    } else if (isAction(tag)) {
      if (method === "get") out.push(`${where}: an action must change something (use a source for a list)`);
      if (!tag.group) out.push(`${where}: an action needs a group`);
      if (tag.role !== undefined && tag.role !== "admin" && tag.role !== "owner") out.push(`${where}: role must be "admin" or "owner"`);
      for (const [name, ref] of Object.entries(tag.when?.differs ?? {})) {
        if (!/^(user|route)\.\w+$/u.test(ref)) out.push(`${where}: when.differs.${name} must be "user.<field>" or "route.<param>"`);
      }
      for (const [name, want] of Object.entries(tag.when?.field ?? {})) {
        const ok = (v: unknown) => ["string", "number", "boolean"].includes(typeof v);
        if (!(Array.isArray(want) ? want.length > 0 && want.every(ok) : ok(want))) out.push(`${where}: when.field.${name} must be a string, number or boolean, or a non-empty list of them`);
      }
      for (const [arg, from] of Object.entries(tag.args ?? {})) {
        if (from === "prompt") out.push(`${where}: argument ${arg} is "prompt", which is not supported yet`);
      }
    } else {
      out.push(`${where}: x-palette is neither an action (title, group), a source (source) nor false`);
    }
  }
  return out;
}

/** Operations that change something and have neither an `x-palette` tag nor `x-palette: false`: the gaps a contract test lists. */
export function untaggedActions(doc: OpenApiDocument): string[] {
  return operations(doc)
    .filter((o) => o.method !== "get" && o.tag === undefined)
    .map((o) => `${o.method.toUpperCase()} ${o.path} (${o.op.operationId ?? "no operationId"})`);
}

function fill(template: string, values: (name: string) => unknown, encode = false): string | null {
  let missing = false;
  const text = template.replace(/\{([^{}]+)\}/g, (_m, name: string) => {
    const v = values(name);
    if (v === undefined || v === null || v === "") {
      missing = true;
      return "";
    }
    return encode ? encodeURIComponent(String(v)) : String(v);
  });
  return missing ? null : text;
}

function resolveArgs(args: Record<string, string> | undefined, ctx: PaletteContext): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const [name, from] of Object.entries(args ?? {})) {
    let value: unknown = from;
    if (from.startsWith("route.")) value = ctx.params[from.slice(6)];
    else if (from.startsWith("selection.")) value = ctx.selection?.[from.slice(10)];
    if (value === undefined || value === null || value === "") return null;
    out[name] = String(value);
  }
  return out;
}

function applies(tag: PaletteActionTag, ctx: PaletteContext): boolean {
  if (!hasRole(tag.role, ctx.user)) return false;
  const w = tag.when;
  if (w?.route !== undefined && w.route !== ctx.route) return false;
  if ((w?.needs === "selection" || w?.field !== undefined || w?.differs !== undefined) && !ctx.selection) return false;
  for (const [name, ref] of Object.entries(w?.differs ?? {})) {
    const other = ref.startsWith("user.") ? ctx.user?.[ref.slice(5)] : ref.startsWith("route.") ? ctx.params[ref.slice(6)] : undefined;
    if (other === undefined || other === null || other === "" || String(ctx.selection?.[name]) === String(other)) return false;
  }
  for (const [name, want] of Object.entries(w?.field ?? {})) {
    const have = ctx.selection?.[name];
    if (!(Array.isArray(want) ? (want as readonly unknown[]).includes(have) : have === want)) return false;
  }
  return true;
}

/**
 * The commands the tags describe, for where the person is now. A command whose route, selection, title names or
 * arguments do not resolve here is left out. An action with no `when` appears once two characters are typed. Choosing
 * one asks to confirm (a DELETE always, unless `confirm: false`), calls the operation, then runs `after`.
 */
export function commandsFromSpec(doc: OpenApiDocument, ctx: PaletteContext, runtime: PaletteRuntime): Command[] {
  const commands: Command[] = [];
  const names = (name: string): unknown => ctx.selection?.[name] ?? ctx.params[name];
  for (const { method, path, op, tag } of operations(doc)) {
    if (!isAction(tag) || op.operationId === undefined || method === "get") continue;
    if (!applies(tag, ctx)) continue;
    const title = fill(tag.title, names);
    const args = resolveArgs(tag.args, ctx);
    if (title === null || args === null) continue;
    const operationId = op.operationId;
    const ask: string | null =
      tag.confirm === false ? null : typeof tag.confirm === "string" ? fill(tag.confirm, names) ?? `${title}?` : tag.confirm === true || method === "delete" ? `${title}?` : null;
    const after = tag.after;
    commands.push({
      id: `api:${operationId}`,
      title,
      group: tag.group,
      ...(tag.hint ? { hint: tag.hint } : {}),
      ...(tag.keywords ? { keywords: tag.keywords } : {}),
      ...(tag.when === undefined ? { minChars: 2 } : {}),
      run: async () => {
        if (ask !== null && !(await runtime.confirm(ask, { danger: method === "delete" }))) return;
        await runtime.call({ operationId, method, path, args });
        if (after?.invalidate) runtime.invalidate(after.invalidate);
        if (after?.navigate) {
          const to = fill(after.navigate, (n) => ctx.params[n] ?? ctx.selection?.[n], true);
          if (to !== null) runtime.navigate(to);
        }
      },
    });
  }
  return commands;
}

/** The searchable lists the tags describe, one `CommandSource` each; choosing a result navigates to its route. */
export function sourcesFromSpec(doc: OpenApiDocument, runtime: Pick<PaletteRuntime, "call" | "navigate">, user?: Record<string, unknown> | null): CommandSource[] {
  const out: CommandSource[] = [];
  for (const { method, path, op, tag } of operations(doc)) {
    if (!isSource(tag) || method !== "get" || op.operationId === undefined || !hasRole(tag.role, user)) continue;
    const s = tag.source;
    const operationId = op.operationId;
    out.push({
      id: `api-source:${operationId}`,
      group: s.group,
      minChars: s.minChars ?? 2,
      limit: s.limit ?? 8,
      search: async (query, signal) => {
        const body = (await runtime.call({ operationId, method, path, args: { [s.param ?? "q"]: query, limit: String(s.limit ?? 8) }, signal })) as { items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> | null;
        const items = Array.isArray(body) ? body : (body?.items ?? []);
        const commands: Command[] = [];
        items.forEach((item, i) => {
          const title = fill(s.title, (n) => item[n]);
          const to = fill(s.route, (n) => item[n], true);
          if (title === null || to === null) return;
          const hint = s.hint ? fill(s.hint, (n) => item[n]) : null;
          commands.push({ id: `${operationId}:${i}:${to}`, title, group: s.group, ...(hint ? { hint } : {}), run: () => runtime.navigate(to) });
        });
        return commands;
      },
    });
  }
  return out;
}
