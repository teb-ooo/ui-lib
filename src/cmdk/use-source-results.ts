import { useEffect, useState } from "react";
import type { SourceRegistry, SourceSection } from "./sources";

interface Entry {
  query: string;
  commands: SourceSection["commands"];
  status: SourceSection["status"];
}

const DEFAULT_MIN_CHARS = 2;
const DEFAULT_DEBOUNCE = 150;
const DEFAULT_LIMIT = 8;

/**
 * Asks every registered source while `query` is typed at the root of the palette: after a pause, with the earlier
 * request aborted, keeping the old results on screen until the new ones arrive. A source that throws shows as failed
 * and never breaks the palette.
 */
export function useSourceResults(registry: SourceRegistry, query: string, enabled: boolean, version: number): SourceSection[] {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const q = query.trim();

  useEffect(() => {
    if (!enabled) return;
    const sources = registry.all();
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const controllers: AbortController[] = [];
    const live = new Set(sources.map((s) => s.id));
    setEntries((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => live.has(id))));
    for (const source of sources) {
      if (q.length < (source.minChars ?? DEFAULT_MIN_CHARS)) {
        setEntries((prev) => {
          if (!(source.id in prev)) return prev;
          const { [source.id]: _gone, ...rest } = prev;
          return rest;
        });
        continue;
      }
      setEntries((prev) => ({ ...prev, [source.id]: { query: q, commands: prev[source.id]?.commands ?? [], status: "loading" } }));
      const controller = new AbortController();
      controllers.push(controller);
      timers.push(
        setTimeout(() => {
          void Promise.resolve()
            .then(() => source.search(q, controller.signal))
            .then(
              (commands) => {
                if (controller.signal.aborted) return;
                setEntries((prev) => ({ ...prev, [source.id]: { query: q, commands: commands.slice(0, source.limit ?? DEFAULT_LIMIT) as SourceSection["commands"], status: "done" } }));
              },
              () => {
                if (controller.signal.aborted) return;
                setEntries((prev) => ({ ...prev, [source.id]: { query: q, commands: [], status: "error" } }));
              },
            );
        }, source.debounceMs ?? DEFAULT_DEBOUNCE),
      );
    }
    return () => {
      for (const t of timers) clearTimeout(t);
      for (const c of controllers) c.abort();
    };
  }, [registry, q, enabled, version]);

  if (!enabled) return [];
  return registry
    .all()
    .filter((s) => entries[s.id] !== undefined && q.length >= (s.minChars ?? DEFAULT_MIN_CHARS))
    .map((s) => {
      const e = entries[s.id] as Entry;
      return { id: s.id, group: s.group, commands: e.commands, status: e.status };
    });
}
