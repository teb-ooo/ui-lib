import { ASK_ASSISTANT_ID } from "./builtins";
import { groupRanked, rankCommands } from "./search";
import type { Command } from "./types";

export interface PaletteRow {
  /** Position in the flat, keyboard-navigable list. */
  index: number;
  command: Command;
  /** Text shown for the row (the fallback row quotes the query). */
  label: string;
  /** Matched character positions in `label` to highlight. */
  indices: number[];
  /** The "no results" assistant row. */
  fallback: boolean;
}

export interface PaletteSection {
  group: string;
  rows: PaletteRow[];
}

export interface PaletteModel {
  sections: PaletteSection[];
  rows: PaletteRow[];
}

export interface ModelInput {
  query: string;
  /** Commands of the current view (root: every available command). */
  commands: readonly Command[];
  /** Ids of recently run commands, most recent first; used on an empty query at the root only. */
  recents: readonly string[];
  /** Root view (not nested)? Recents and the assistant fallback only apply there. */
  root: boolean;
}

/** Turns the current view, query and recents into the sections and flat row list the palette renders. */
export function buildPaletteModel({ query, commands, recents, root }: ModelInput): PaletteModel {
  const q = query.trim();
  const sections: PaletteSection[] = [];
  let index = 0;
  const push = (group: string, items: Array<{ command: Command; label: string; indices: number[]; fallback?: boolean }>): void => {
    if (items.length === 0) return;
    const rows = items.map((it): PaletteRow => ({ index: index++, command: it.command, label: it.label, indices: it.indices, fallback: it.fallback ?? false }));
    sections.push({ group, rows });
  };

  let pool = commands;
  if (q === "" && root) {
    const byId = new Map(commands.map((c) => [c.id, c]));
    const recent = recents.map((id) => byId.get(id)).filter((c): c is Command => c !== undefined);
    push("Recent", recent.map((command) => ({ command, label: command.title, indices: [] })));
    const recentIds = new Set(recent.map((c) => c.id));
    pool = commands.filter((c) => !recentIds.has(c.id));
  }

  const ranked = rankCommands(q, pool);
  for (const section of groupRanked(ranked)) {
    push(
      section.group,
      section.items.map((r) => ({ command: r.command, label: r.command.title, indices: r.indices })),
    );
  }

  if (ranked.length === 0 && q !== "" && root) {
    const ask = commands.find((c) => c.id === ASK_ASSISTANT_ID);
    if (ask) push(ask.group, [{ command: ask, label: `Ask assistant: ${q}`, indices: [], fallback: true }]);
  }

  return { sections, rows: sections.flatMap((s) => s.rows) };
}
