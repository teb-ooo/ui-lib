import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@teb-ooo/ui";
import { PaletteFormDialog } from "./palette-form";
import { platformFetch, redirectToLogin, throwIfNotOk, useUser } from "@teb-ooo/web";
import { commandsFromSpec, sourcesFromSpec } from "./from-spec";
import type { OpenApiDocument, PaletteCall, PaletteFormRequest, PaletteRuntime } from "./from-spec";
import { useRegisterCommands } from "./use-register-commands";
import { useCommandSource } from "./use-register-source";
import type { CommandSource } from "./sources";

// The selected row a screen publishes. One value at a time, like focus: the screen that shows it sets it and clears it.
let selection: Record<string, unknown> | null = null;
const listeners = new Set<() => void>();
function setSelection(next: Record<string, unknown> | null): void {
  selection = next;
  for (const l of Array.from(listeners)) l();
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
      return encodeURIComponent(String(v));
    });
    const isGet = method === "get";
    const query = isGet && Object.keys(rest).length > 0 ? `?${new URLSearchParams(Object.entries(rest).map(([k, v]) => [k, String(v)])).toString()}` : "";
    const hasBody = !isGet && Object.keys(rest).length > 0;
    const res = await platformFetch(
      `${base}${url}${query}`,
      {
        method: method.toUpperCase(),
        ...(hasBody ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) } : {}),
        ...(signal ? { signal } : {}),
      },
      { fetch: f },
    );
    if (res.status === 401) redirectToLogin();
    await throwIfNotOk(res);
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
  /** Asks before an action that confirms. @default a `ConfirmDialog` over the page */
  confirm?: PaletteRuntime["confirm"];
  /** Turns the generated commands and searches off (a section of the app where they do not apply). Prefer a tag's `role` for who may see them. @default true */
  enabled?: boolean;
}

/**
 * Turns the `x-palette` tags of the API document into Cmd+K commands and sources: render it once in the root route
 * (inside `CommandProvider`, the router and the query client). Actions appear for the current route and the row a screen
 * published with `usePaletteSelection`; sources are searched while typing. Hand-written `useRegisterCommands` still
 * works beside it for everything that is not tagged.
 */
export function PaletteFromApi({ spec, call, confirm, enabled = true }: PaletteFromApiProps): ReactElement {
  const navigate = useNavigate();
  const client = useQueryClient();
  const row = useSelection();
  const { user } = useUser();
  const last = useRouterState().matches.at(-1) as { fullPath?: string; params?: unknown } | undefined;
  const route = last?.fullPath ?? "";
  // The route parameters by value, so the command list is rebuilt only when they change.
  const paramsKey = JSON.stringify(last?.params ?? {});
  const params = useMemo(() => JSON.parse(paramsKey) as Record<string, string>, [paramsKey]);
  // The default confirm is a dialog over the page: the command waits on a promise the dialog settles.
  const [filling, setFilling] = useState<{ request: PaletteFormRequest; settle: () => void } | null>(null);
  const [asking, setAsking] = useState<{ message: string; danger: boolean; settle: (ok: boolean) => void } | null>(null);
  const runtime = useMemo<PaletteRuntime>(
    () => ({
      call: call ?? paletteFetch(),
      confirm: confirm ?? ((message, options) => new Promise<boolean>((settle) => setAsking({ message, danger: options?.danger === true, settle }))),
      prompt: (request) => new Promise<void>((settle) => setFilling({ request, settle })),
      invalidate: (prefixes) => {
        // openapi-react-query keys are [method, path, init]; a hand-made key may start with the path itself.
        void client.invalidateQueries({
          predicate: (q) => {
            const path = typeof q.queryKey[1] === "string" ? q.queryKey[1] : typeof q.queryKey[0] === "string" ? q.queryKey[0] : "";
            return path !== "" && prefixes.some((p) => path.startsWith(p));
          },
        });
      },
      navigate: (to) => void navigate({ to }),
    }),
    [call, confirm, client, navigate],
  );
  const commands = useMemo(() => (enabled ? commandsFromSpec(spec, { route, params, selection: row, user: user as Record<string, unknown> | null }, runtime) : []), [enabled, spec, route, params, row, user, runtime]);
  useRegisterCommands(commands, [commands]);
  const sources = useMemo(() => (enabled ? sourcesFromSpec(spec, runtime, user as Record<string, unknown> | null) : []), [enabled, spec, runtime, user]);
  // One source per tagged list: they are registered by a child so each can use the hook.
  const answer = (ok: boolean) => {
    asking?.settle(ok);
    setAsking(null);
  };
  return (
    <>
      {sources.map((s) => (
        <Source key={s.id} source={s} />
      ))}
      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(o) => {
          if (!o) answer(false);
        }}
        title={asking?.message ?? ""}
        confirmLabel={asking?.danger ? "Delete" : "Confirm"}
        danger={asking?.danger === true}
        onConfirm={() => answer(true)}
      />
      {filling ? (
        <PaletteFormDialog
          request={filling.request}
          onClose={() => {
            filling.settle();
            setFilling(null);
          }}
        />
      ) : null}
    </>
  );
}

function Source({ source }: { source: CommandSource }): null {
  useCommandSource(source, [source]);
  return null;
}
