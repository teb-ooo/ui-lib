import { createContext, useContext } from "react";
import type { CommandRegistry } from "./registry";
import type { Command } from "./types";
import type { Outcome } from "./execute";

/** Public: what `useCommandPalette` returns. */
export interface CommandPaletteApi {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

/** State the palette needs to show, set when a shortcut ran a command that has more to show. */
export interface PaletteInitial {
  stack?: Array<{ title: string; commands: Command[] }>;
  error?: { title: string; message: string };
}

/** Internal: stable across open and close, so registering components never re-render on them. */
export interface CommandInternals {
  registry: CommandRegistry;
  /** Every command available right now (registered plus built-in) whose `when` allows it. */
  getCommands: () => Command[];
  recents: string[];
  /** Runs a command chosen in the palette; records it in the recents when it completes. */
  run: (command: Command, query: string, fallback: boolean) => Outcome | Promise<Outcome>;
  close: () => void;
  initial: PaletteInitial;
}

export const PaletteApiContext = createContext<CommandPaletteApi | null>(null);
export const InternalsContext = createContext<CommandInternals | null>(null);

export function usePaletteApi(): CommandPaletteApi {
  const v = useContext(PaletteApiContext);
  if (!v) throw new Error("useCommandPalette must be used inside <CommandProvider>");
  return v;
}

export function useInternals(hook = "useRegisterCommands"): CommandInternals {
  const v = useContext(InternalsContext);
  if (!v) throw new Error(`${hook} must be used inside <CommandProvider>`);
  return v;
}
