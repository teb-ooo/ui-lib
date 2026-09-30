import type { Command, CommandContext } from "./types";

/** What running a command led to. */
export type Outcome = { kind: "done" } | { kind: "view"; title: string; commands: Command[] };

function isThenable(v: unknown): v is PromiseLike<unknown> {
  return typeof v === "object" && v !== null && "then" in v && typeof (v as { then: unknown }).then === "function";
}

function toOutcome(command: Command, value: unknown): Outcome {
  if (Array.isArray(value)) return { kind: "view", title: command.title, commands: value as Command[] };
  return { kind: "done" };
}

/**
 * Runs a command. `children` (or a returned list) becomes a nested view; a promise resolves to the outcome
 * and rejects when `run` rejects. Synchronous throws surface as a rejected promise, so callers handle one path.
 */
export function execute(command: Command, ctx: CommandContext): Outcome | Promise<Outcome> {
  try {
    if (command.children !== undefined) {
      const list = typeof command.children === "function" ? command.children() : command.children;
      return { kind: "view", title: command.title, commands: [...list] };
    }
    const result: unknown = command.run?.(ctx);
    if (isThenable(result)) return Promise.resolve(result).then((v) => toOutcome(command, v));
    return toOutcome(command, result);
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message !== "") return err.message;
  if (typeof err === "string" && err !== "") return err;
  return "Something went wrong";
}
