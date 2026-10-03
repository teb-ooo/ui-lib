import { fuzzyMatch } from "./fuzzy";
import { groupRanked, rankCommands } from "./search";
import type { SourceSection } from "./sources";
import type { Command } from "./types";

export interface PaletteRow {
  /** Position in the flat, keyboard-navigable list. */
  index: number;
  command: Command;
  /** Text shown for the row (the fallback row quotes the query). */
  label: string;
  /** Matched character positions in `label` to highlight. */
  indices: number[];
  /** Always false: kept so existing code that reads it still compiles (the assistant fallback row was removed in 0.53.0). */
  fallback: boolean;
}

export interface PaletteSection {
  group: string;
  rows: PaletteRow[];
  /** A source section still asking (`loading`) or that failed (`error`); drawn as a quiet line under its rows. */
  status?: "loading" | "error";
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
  /** Root view (not nested)? Recents only apply there. */
  root: boolean;
  /** Results of the registered sources for this query (root only), shown after the matching commands. */
  external?: readonly SourceSection[];
}

/** Turns the current view, query and recents into the sections and flat row list the palette renders. */
export function buildPaletteModel({ query, commands, recents, root, external = [] }: ModelInput): PaletteModel {
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

  for (const ext of external) {
    // The server ranked and filtered them; the typed letters are still marked in each title.
    const rows = ext.commands.map((command): PaletteRow => ({ index: index++, command, label: command.title, indices: q === "" ? [] : (fuzzyMatch(q, command.title)?.indices ?? []), fallback: false }));
    if (rows.length === 0 && ext.status === "done") continue;
    sections.push({ group: ext.group, rows, ...(ext.status === "done" ? {} : { status: ext.status }) });
  }

  return { sections, rows: sections.flatMap((s) => s.rows) };
}
