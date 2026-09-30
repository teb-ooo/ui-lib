import { useEffect, useLayoutEffect, useRef } from "react";
import type { DependencyList } from "react";
import { useInternals } from "./context";
import { warnOnce } from "./dev";
import type { Command } from "./types";

/**
 * Registers commands while the calling component is mounted; they are removed on unmount.
 *
 * `run`, `when` and the other fields are always read from the latest render, so closures are never stale.
 * `deps` (default `[]`) says when the *list itself* changed (titles, added or removed commands) and the
 * palette should re-read it, like the dependency array of `useEffect`.
 */
export function useRegisterCommands(commands: readonly Command[], deps: DependencyList = []): void {
  const { registry } = useInternals("useRegisterCommands");
  const latest = useRef(commands);
  const handle = useRef<{ update: () => void } | null>(null);

  useLayoutEffect(() => {
    latest.current = commands;
  });

  useEffect(() => {
    const h = registry.register(() => latest.current);
    handle.current = h;
    return () => {
      handle.current = null;
      h.unregister();
    };
  }, [registry]);

  useEffect(() => handle.current?.update(), deps);

  // Development check: the list changed (ids, titles, groups, shortcuts) but `deps` did not, so the palette
  // would keep showing the old list. Pass the values the list depends on as `deps`.
  const seen = useRef<{ signature: string; deps: DependencyList } | null>(null);
  useEffect(() => {
    const signature = commands.map((c) => `${c.id}|${c.title}|${c.group}|${c.shortcut ?? ""}`).join("\n");
    const prev = seen.current;
    seen.current = { signature, deps };
    if (prev && prev.signature !== signature && prev.deps.length === deps.length && prev.deps.every((d, i) => Object.is(d, deps[i]))) {
      warnOnce(`deps:${signature.split("\n")[0] ?? ""}`, "useRegisterCommands: the commands changed but `deps` did not, so the palette shows the old list. Pass what the list depends on as the second argument.");
    }
  });
}
