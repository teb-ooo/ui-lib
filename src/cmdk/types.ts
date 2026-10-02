import type { ComponentType, ReactNode } from "react";

/** Props an icon component receives. Lucide icons satisfy this. */
export interface CommandIconProps {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

/** An icon: a component such as a Lucide icon (`Plus`), or a ready element. */
export type CommandIcon = ComponentType<CommandIconProps> | ReactNode;

/** Passed to `Command.run`. */
export interface CommandContext {
  /** What the user typed when the command was chosen (empty for shortcuts). */
  query: string;
  /** True when the command was chosen as the "no results" fallback row. */
  fallback: boolean;
  /** Closes the palette. Commands that navigate need not call it: the palette closes after `run`. */
  close: () => void;
  /**
   * Runs `fn` once the palette has closed and focus has returned to where it was, so a command can move focus
   * (or scroll, or open something) without racing the palette. Runs on a microtask when no palette is open
   * (a shortcut ran the command).
   */
  afterClose: (fn: () => void) => void;
}

/** What `run` may return: nothing, a promise, or a list that opens as a nested view. */
export type CommandResult = void | Command[] | Promise<void | Command[]>;

export interface Command {
  /** Stable, unique id. Registering the same id twice keeps the later one. */
  id: string;
  /** Verb-first, e.g. "New item". */
  title: string;
  /** Section heading in the palette, e.g. "Items". */
  group: string;
  /** Extra search terms. */
  keywords?: readonly string[];
  /** `g i` (sequence), `mod+shift+n` (chord). `mod` is Cmd on macOS, Ctrl elsewhere. */
  shortcut?: string;
  icon?: CommandIcon;
  /** Quiet text after the title: the kind of thing it opens, such as an entry's type ("City"). */
  hint?: string;
  /** Hide the command while this is false. Evaluated each time the palette renders or a shortcut is pressed. */
  when?: boolean | (() => boolean);
  /** Executed on Enter, click or shortcut. Return a promise to show a spinner; a rejection shows an inline error row. */
  run?: (ctx: CommandContext) => CommandResult;
  /** Opens a nested view with a breadcrumb instead of running. */
  children?: readonly Command[] | (() => readonly Command[]);
}
