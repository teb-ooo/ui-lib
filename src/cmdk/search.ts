import { fuzzyMatch } from "./fuzzy";
import type { Command } from "./types";

export interface RankedCommand {
  command: Command;
  score: number;
  /** Matched character positions in `command.title`, for highlighting. Empty when only a keyword matched. */
  indices: number[];
}

export interface CommandSection {
  group: string;
  items: RankedCommand[];
}

const KEYWORD_WEIGHT = 0.8;

/**
 * Matches `query` against each title and its keywords. With an empty query every command is returned in
 * its original order. Otherwise the result is sorted best first; ties keep registration order.
 */
export function rankCommands(query: string, commands: readonly Command[]): RankedCommand[] {
  if (query.trim() === "") return commands.map((command) => ({ command, score: 0, indices: [] }));
  const out: Array<RankedCommand & { order: number }> = [];
  commands.forEach((command, order) => {
    const title = fuzzyMatch(query, command.title);
    let best = title ? title.score : Number.NEGATIVE_INFINITY;
    for (const kw of command.keywords ?? []) {
      const k = fuzzyMatch(query, kw);
      if (k && k.score * KEYWORD_WEIGHT > best) best = k.score * KEYWORD_WEIGHT;
    }
    if (best === Number.NEGATIVE_INFINITY) return;
    out.push({ command, score: best, indices: title ? title.indices : [], order });
  });
  out.sort((a, b) => b.score - a.score || a.order - b.order);
  return out.map(({ command, score, indices }) => ({ command, score, indices }));
}

/**
 * Groups ranked commands by `group`. Sections appear in order of first item, which for a query means the
 * section holding the best match comes first; within a section the order of `ranked` is kept.
 */
export function groupRanked(ranked: readonly RankedCommand[]): CommandSection[] {
  const sections = new Map<string, CommandSection>();
  for (const r of ranked) {
    const g = r.command.group;
    let s = sections.get(g);
    if (!s) {
      s = { group: g, items: [] };
      sections.set(g, s);
    }
    s.items.push(r);
  }
  return [...sections.values()];
}
