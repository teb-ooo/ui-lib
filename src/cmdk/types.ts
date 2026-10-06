import type { ComponentType, ReactNode } from "react";
import type { PaletteFormField } from "./form-fields";

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

/**
 * A form the palette walks through, one field at a time in its own input, then a review step with the answers and the
 * submit row. A command returns it from `run` as `{ form }`.
 */
export interface CommandForm {
  /** The command's title: it is the breadcrumb of the form and the heading of its review. */
  title: string;
  /** The submit row of the review: "Create rule". */
  submitLabel: string;
  fields: PaletteFormField[];
  /** For a field whose choices come from a list operation: loads them (`value` is sent, `label` is shown). */
  loadOptions?: Record<string, () => Promise<{ value: string; label: string }[]>>;
  /** An object schema of just these fields, for `createBodyValidator`. */
  schema: Record<string, unknown>;
  /**
   * Runs the action with the answers. A rejection with an `ApiError` takes the person back to the field the server
   * names, with its message; any other failure is shown on the review step. Resolving closes the palette.
   */
  submit: (values: Record<string, string | number | boolean>) => Promise<void>;
}

/** What a command returns to start a form step inside the palette. */
export interface CommandFormResult {
  form: CommandForm;
}

/** What `run` may return: nothing, a promise, a list that opens as a nested view, or a form to step through. */
export type CommandResult = void | Command[] | CommandFormResult | Promise<void | Command[] | CommandFormResult>;

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
  /** Hide the command until the query has at least this many characters (a command that fits no screen in particular, so it does not crowd the empty palette). @default 0 */
  minChars?: number;
  /** Hide the command while this is false. Evaluated each time the palette renders or a shortcut is pressed. */
  when?: boolean | (() => boolean);
  /** Executed on Enter, click or shortcut. Return a promise to show a spinner; a rejection shows an inline error row. */
  run?: (ctx: CommandContext) => CommandResult;
  /** Opens a nested view with a breadcrumb instead of running. */
  children?: readonly Command[] | (() => readonly Command[]);
}
