import type { Command } from "./types";

type Listener = () => void;

interface Registration {
  readonly token: symbol;
  /** Reads the latest commands; called lazily so `run` closures are never stale. */
  readonly read: () => readonly Command[];
}

/** Resolves `when` (boolean or function; a throwing function hides the command). */
export function isVisible(command: Command): boolean {
  const w = command.when;
  if (w === undefined) return true;
  if (typeof w === "boolean") return w;
  try {
    return w();
  } catch {
    return false;
  }
}

/**
 * The set of currently registered commands. A tiny external store so React can subscribe with
 * `useSyncExternalStore` and non-React code (tests, shortcut handler) can read it.
 */
export class CommandRegistry {
  private registrations: Registration[] = [];
  private listeners = new Set<Listener>();
  private version = 0;

  /** Adds a source of commands; returns the function that removes it. */
  register(read: () => readonly Command[]): { update: () => void; unregister: () => void } {
    const reg: Registration = { token: Symbol("registration"), read };
    this.registrations = [...this.registrations, reg];
    this.emit();
    return {
      update: () => this.emit(),
      unregister: () => {
        this.registrations = this.registrations.filter((r) => r !== reg);
        this.emit();
      },
    };
  }

  /** Bumps when registrations change; use as the `getSnapshot` of a store. */
  getVersion = (): number => this.version;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** All registered commands in registration order; a later duplicate id replaces the earlier one. */
  all(): Command[] {
    const byId = new Map<string, Command>();
    for (const reg of this.registrations) {
      for (const c of reg.read()) {
        byId.delete(c.id);
        byId.set(c.id, c);
      }
    }
    return [...byId.values()];
  }

  /** Registered commands whose `when` allows them right now. */
  visible(): Command[] {
    return this.all().filter(isVisible);
  }

  private emit(): void {
    this.version += 1;
    for (const l of [...this.listeners]) l();
  }
}
