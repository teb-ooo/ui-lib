import { createContext, useContext } from "react";
import type { Command } from "../cmdk/types";

/**
 * What `CommandProvider` (from `@teb-ooo/ui/cmdk`) hands to the page frame: open the palette and register commands.
 * It exists so `Shell` can show the palette trigger and register the platform commands without importing the palette.
 * Internal: an app never provides or reads it.
 */
export interface CommandHost {
  open: () => void;
  isOpen: boolean;
  /** Registers a command list that is read fresh each time; `update` says the list changed. */
  register: (get: () => readonly Command[]) => { update: () => void; unregister: () => void };
}

export const CommandHostContext = createContext<CommandHost | null>(null);

export function useCommandHost(): CommandHost | null {
  return useContext(CommandHostContext);
}
