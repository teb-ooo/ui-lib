import type { Command } from "./types";

/**
 * A place the palette searches while someone types: an app's own list or search API. The app says how to ask it and how
 * to turn what comes back into commands (usually "open this entry"); the palette does the debouncing, the cancelling
 * and the showing.
 */
export interface CommandSource {
  /** Stable, unique id. */
  id: string;
  /** Section heading the results appear under, for example "Entries". */
  group: string;
  /**
   * Asks the API. `signal` aborts when the query changes or the palette closes: pass it to the request. Return the
   * commands in the order the server ranked them; they are not filtered again here.
   */
  search: (query: string, signal: AbortSignal) => Promise<readonly Command[]> | readonly Command[];
  /** Fewest characters before the source is asked. @default 2 */
  minChars?: number;
  /** Milliseconds to wait after the last keystroke. @default 150 */
  debounceMs?: number;
  /** Most results shown. @default 8 */
  limit?: number;
}

/** What the palette holds per source for the current query. */
export interface SourceSection {
  id: string;
  group: string;
  commands: Command[];
  /** `loading` while the request runs (earlier results stay until it answers), `error` when it failed. */
  status: "loading" | "done" | "error";
}

type Listener = () => void;

/** The registered sources, observable like the command registry. */
export class SourceRegistry {
  private sources: Array<{ token: symbol; read: () => CommandSource }> = [];
  private listeners = new Set<Listener>();
  private version = 0;

  register(read: () => CommandSource): { update: () => void; unregister: () => void } {
    const reg = { token: Symbol("source"), read };
    this.sources = [...this.sources, reg];
    this.emit();
    return {
      update: () => this.emit(),
      unregister: () => {
        this.sources = this.sources.filter((s) => s !== reg);
        this.emit();
      },
    };
  }

  getVersion = (): number => this.version;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** The sources in registration order; a later one with the same id replaces the earlier. */
  all(): CommandSource[] {
    const byId = new Map<string, CommandSource>();
    for (const s of this.sources) {
      const source = s.read();
      byId.delete(source.id);
      byId.set(source.id, source);
    }
    return [...byId.values()];
  }

  private emit(): void {
    this.version += 1;
    for (const l of [...this.listeners]) l();
  }
}

/**
 * Runs a source the way the palette would, for tests: returns nothing while the query is shorter than `minChars`,
 * otherwise awaits `search` (with a live `AbortSignal`) and returns at most `limit` commands in the server's order.
 * No palette, provider or timers: test what your source returns, then test the command's `run` yourself.
 */
export async function runCommandSource(source: CommandSource, query: string, signal: AbortSignal = new AbortController().signal): Promise<Command[]> {
  if (query.trim().length < (source.minChars ?? 2)) return [];
  const found = await source.search(query, signal);
  return found.slice(0, source.limit ?? 8);
}
