import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { commandsFromSpec, sourcesFromSpec } from "./from-spec";
import type { OpenApiDocument, PaletteCall, PaletteRuntime } from "./from-spec";
import { useRegisterCommands } from "./use-register-commands";
import { useCommandSource } from "./use-register-source";
import type { CommandSource } from "./sources";

// The selected row a screen publishes. One value at a time, like focus: the screen that shows it sets it and clears it.
let selection: Record<string, unknown> | null = null;
const listeners = new Set<() => void>();
function setSelection(next: Record<string, unknown> | null): void {
  selection = next;
  for (const l of [...listeners]) l();
}
function useSelection(): Record<string, unknown> | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selection,
    () => null,
  );
}

/**
 * A screen publishes the row the person has open or selected, so an action tagged `needs: "selection"` and a
 * `selection.<field>` argument can use it. Pass `null` for no selection; it is cleared when the screen unmounts.
 */
export function usePaletteSelection(row: Record<string, unknown> | null): void {
  useEffect(() => {
    setSelection(row);
    return () => setSelection(null);
  }, [row]);
}

export interface PaletteFetchOptions {
  /** @default "" (same origin) */
  base?: string;
  fetch?: typeof globalThis.fetch;
}

/**
 * The default way to call an operation: `{name}` in the path from `args`, the rest as query parameters on a GET and
 * as a JSON body otherwise; cookies included; a problem answer throws its `detail` or `title`. An app with a generated
 * client passes its own `call` to `PaletteFromApi` instead.
 */
export function paletteFetch({ base = "", fetch: f = globalThis.fetch }: PaletteFetchOptions = {}): (call: PaletteCall) => Promise<unknown> {
  return async ({ method, path, args, signal }) => {
    const rest = { ...args };
    const url = path.replace(/\{([^}]+)\}/g, (_m, name: string) => {
      const v = rest[name] ?? "";
      delete rest[name];
      return encodeURIComponent(v);
    });
    const isGet = method === "get";
    const query = isGet && Object.keys(rest).length > 0 ? `?${new URLSearchParams(rest).toString()}` : "";
    const res = await f(`${base}${url}${query}`, {
      method: method.toUpperCase(),
      credentials: "include",
      headers: { Accept: "application/json", ...(isGet || Object.keys(rest).length === 0 ? {} : { "Content-Type": "application/json" }) },
      ...(isGet || Object.keys(rest).length === 0 ? {} : { body: JSON.stringify(rest) }),
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) {
      let message = `The server answered ${res.status}.`;
      try {
        const p = (await res.json()) as { detail?: string; title?: string };
        message = p.detail ?? p.title ?? message;
      } catch {
        // not a problem document
      }
      throw new Error(message);
    }
    if (res.status === 204) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  };
}

export interface PaletteFromApiProps {
  /** The app's OpenAPI document (generated; `web/src/api/openapi.json`). */
  spec: OpenApiDocument;
  /** Calls an operation. @default `paletteFetch()` */
  call?: PaletteRuntime["call"];
  /** Asks before a destructive action. @default `window.confirm` */
  confirm?: PaletteRuntime["confirm"];
}

/**
 * Turns the `x-palette` tags of the API document into Cmd+K commands and sources: render it once in the root route
 * (inside `CommandProvider`, the router and the query client). Actions appear for the current route and the row a screen
 * published with `usePaletteSelection`; sources are searched while typing. Hand-written `useRegisterCommands` still
 * works beside it for everything that is not tagged.
 */
export function PaletteFromApi({ spec, call, confirm }: PaletteFromApiProps): ReactElement {
  const navigate = useNavigate();
  const client = useQueryClient();
  const row = useSelection();
  const last = useRouterState().matches.at(-1) as { fullPath?: string; params?: unknown } | undefined;
  const route = last?.fullPath ?? "";
  const params = (last?.params ?? {}) as Record<string, string>;
  const runtime = useMemo<PaletteRuntime>(
    () => ({
      call: call ?? paletteFetch(),
      confirm: confirm ?? ((m) => window.confirm(m)),
      invalidate: (prefixes) => {
        void client.invalidateQueries({ predicate: (q) => prefixes.some((p) => String(q.queryKey[0] ?? "").startsWith(p)) });
      },
      navigate: (to) => void navigate({ to }),
    }),
    [call, confirm, client, navigate],
  );
  const paramsKey = JSON.stringify(params);
  const commands = useMemo(() => commandsFromSpec(spec, { route, params, selection: row }, runtime), [spec, route, paramsKey, row, runtime]);
  useRegisterCommands(commands, [commands]);
  const sources = useMemo(() => sourcesFromSpec(spec, runtime), [spec, runtime]);
  // One source per tagged list: they are registered by a child so each can use the hook.
  return <>{sources.map((s) => <Source key={s.id} source={s} />)}</>;
}

function Source({ source }: { source: CommandSource }): null {
  useCommandSource(source, [source]);
  return null;
}
