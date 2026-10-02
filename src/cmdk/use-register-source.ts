import { useEffect, useLayoutEffect, useRef } from "react";
import type { DependencyList } from "react";
import { useInternals } from "./context";
import type { CommandSource } from "./sources";

/**
 * Lets the palette search an API while the calling component is mounted: type "mer" and the entries whose names match
 * appear under the source's group, each a command that runs when chosen.
 *
 * `search` and the other fields are read from the latest render; `deps` says when the source itself changed (its id,
 * its group, or what it searches) so the palette asks again.
 */
export function useCommandSource(source: CommandSource, deps: DependencyList = []): void {
  const { sources } = useInternals("useCommandSource");
  const latest = useRef(source);
  const handle = useRef<{ update: () => void } | null>(null);
  useLayoutEffect(() => {
    latest.current = source;
  });
  useEffect(() => {
    const h = sources.register(() => latest.current);
    handle.current = h;
    return () => {
      handle.current = null;
      h.unregister();
    };
  }, [sources]);
  useEffect(() => handle.current?.update(), deps);
}
