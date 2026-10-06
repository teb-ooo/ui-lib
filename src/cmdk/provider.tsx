import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { CommandHostContext } from "@teb-ooo/ui";
import type { CommandHost } from "@teb-ooo/ui";
import { builtinCommands } from "./builtins";
import { InternalsContext, PaletteApiContext } from "./context";
import type { CommandInternals, CommandPaletteApi, PaletteInitial } from "./context";
import { warnOnce } from "./dev";
import { errorMessage, execute } from "./execute";
import type { Outcome } from "./execute";
import { Palette } from "./palette";
import { CommandRegistry, isVisible } from "./registry";
import { SourceRegistry } from "./sources";
import { ShortcutMatcher, isApplePlatform, isTypingTarget, parseShortcut } from "./shortcuts";
import type { BoundShortcut } from "./shortcuts";
import { loadRecents, pushRecent, recentsKey } from "./storage";
import type { Command } from "./types";

export interface CommandProviderProps {
  children: ReactNode;
  /** Milliseconds allowed between the steps of a sequence such as `g i`. Default 1000. */
  sequenceTimeout?: number;
  /** Set when there is deliberately no router (a gallery, a test): silences the development warning about it. */
  standalone?: boolean;
}

/**
 * Owns the palette: open state, the command registry, recents, and the global shortcuts.
 * Mount it once at the root of the app, inside `RouterProvider`, and the `Shell` inside it draws the trigger and registers the platform commands.
 */
export function CommandProvider({ children, sequenceTimeout = 1000, standalone = false }: CommandProviderProps) {
  // Outside a RouterProvider (tests, gallery) there is no router: navigation commands are simply absent.
  const router = useRouter({ warn: false }) as ReturnType<typeof useRouter> | undefined;
  const registry = useMemo(() => new CommandRegistry(), []);
  const sources = useMemo(() => new SourceRegistry(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [initial, setInitial] = useState<PaletteInitial>({});
  const [recents, setRecents] = useState<string[]>(() => loadRecents());
  const isOpenRef = useRef(false);
  const lastFocused = useRef<HTMLElement | null>(null);
  const routerRef = useRef(router);
  routerRef.current = router;
  const afterCloseQueue = useRef<Array<() => void>>([]);

  // Development checks: the provider belongs inside the router, and the app must have imported theme.css
  // (which defines --cmdk-loaded) or the palette renders unstyled without any error.
  useEffect(() => {
    if (!router && !standalone) {
      warnOnce("no-router", "CommandProvider found no router: mount it inside <RouterProvider> (or pass `standalone`). Navigation commands are missing.");
    }
    const check = (): void => {
      if (getComputedStyle(document.documentElement).getPropertyValue("--cmdk-loaded").trim() === "") {
        warnOnce("no-css", 'the palette styles are not loaded: add `@import "@teb-ooo/ui/theme.css";` to the app CSS (it defines --cmdk-loaded and scans the palette classes).');
      }
    };
    if (document.readyState === "complete") check();
    else window.addEventListener("load", check, { once: true });
    return () => window.removeEventListener("load", check);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, at mount
  }, []);

  const getCommands = useCallback((): Command[] => {
    const shortcuts = (): Command[] =>
      getAll().filter((c) => c.shortcut !== undefined && c.shortcut !== "").concat(PALETTE_SHORTCUTS);
    const getAll = (): Command[] => {
      const seen = new Set<string>();
      const out: Command[] = [];
      const builtins = builtinCommands({ router: routerRef.current, listShortcuts: shortcuts });
      for (const c of [...registry.all(), ...builtins]) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        if (isVisible(c)) out.push(c);
      }
      return out;
    };
    return getAll();
  }, [registry]);

  const openPalette = useCallback((next: PaletteInitial = {}) => {
    if (isOpenRef.current) return;
    const el = document.activeElement;
    lastFocused.current = el instanceof HTMLElement && el !== document.body ? el : null;
    isOpenRef.current = true;
    setInitial(next);
    setOpenCount((n) => n + 1);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  // Return focus to whatever had it before the palette opened.
  useEffect(() => {
    if (isOpen) return;
    const el = lastFocused.current;
    lastFocused.current = null;
    if (el && el.isConnected && document.activeElement !== el) el.focus();
    const queued = afterCloseQueue.current.splice(0);
    for (const fn of queued) fn();
  }, [isOpen]);

  const run = useCallback<CommandInternals["run"]>(
    (command, query, fallback) => {
      const record = (o: Outcome): Outcome => {
        if (o.kind === "done") setRecents(pushRecent(command.id, recentsKey()));
        return o;
      };
      const afterClose = (fn: () => void): void => {
        if (isOpenRef.current) afterCloseQueue.current.push(fn);
        else queueMicrotask(fn);
      };
      const out = execute(command, { query, fallback, close: closePalette, afterClose });
      return out instanceof Promise ? out.then(record) : record(out);
    },
    [closePalette],
  );

  const api = useMemo<CommandPaletteApi>(
    () => ({ open: () => openPalette(), close: closePalette, isOpen }),
    [openPalette, closePalette, isOpen],
  );

  const host = useMemo<CommandHost>(
    () => ({ open: () => openPalette(), isOpen, register: (get) => registry.register(get) }),
    [openPalette, isOpen, registry],
  );

  const internals = useMemo<CommandInternals>(
    () => ({ registry, sources, getCommands, recents, run, close: closePalette, initial }),
    [registry, sources, getCommands, recents, run, closePalette, initial],
  );

  // Global keys: the palette shortcut, `/`, and the shortcuts of registered commands.
  useEffect(() => {
    const apple = isApplePlatform();
    const matcher = new ShortcutMatcher<Command>(sequenceTimeout, apple);
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.isComposing || e.defaultPrevented) return;
      const key = e.key.toLowerCase();
      const modOnly = apple
        ? e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey
        : e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
      if (key === "k" && modOnly) {
        e.preventDefault();
        matcher.reset();
        if (isOpenRef.current) closePalette();
        else openPalette();
        return;
      }
      if (isOpenRef.current) {
        matcher.reset();
        return;
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        openPalette();
        return;
      }
      const bindings: Array<BoundShortcut<Command>> = [];
      for (const c of getCommands()) {
        if (!c.shortcut) continue;
        const parsed = parseShortcut(c.shortcut);
        if (parsed) bindings.push({ parsed, target: c });
      }
      const { target, consumed } = matcher.feed(e, bindings, isTypingTarget(e.target));
      if (consumed) e.preventDefault();
      if (!target) return;
      // Shortcut-run commands have no palette to report into: open it only when there is something to show.
      try {
        const out = run(target, "", false);
        if (out instanceof Promise) {
          out.then(
            (o) => {
              if (o.kind === "view") openPalette({ stack: [{ title: o.title, commands: o.commands }] });
              else if (o.kind === "form") openPalette({ stack: [{ title: o.form.title, commands: [], form: o.form }] });
            },
            (err: unknown) => openPalette({ error: { title: target.title, message: errorMessage(err) } }),
          );
        } else if (out.kind === "view") {
          openPalette({ stack: [{ title: out.title, commands: out.commands }] });
        } else if (out.kind === "form") {
          openPalette({ stack: [{ title: out.form.title, commands: [], form: out.form }] });
        }
      } catch (err) {
        openPalette({ error: { title: target.title, message: errorMessage(err) } });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      matcher.reset();
    };
  }, [closePalette, getCommands, openPalette, run, sequenceTimeout]);

  return (
    <PaletteApiContext.Provider value={api}>
      <InternalsContext.Provider value={internals}>
        <CommandHostContext.Provider value={host}>
          {children}
          {isOpen ? <Palette key={openCount} /> : null}
        </CommandHostContext.Provider>
      </InternalsContext.Provider>
    </PaletteApiContext.Provider>
  );
}

/** Shown in the "Keyboard shortcuts" view next to the registered ones. */
const PALETTE_SHORTCUTS: Command[] = [
  { id: "palette:open", title: "Open command palette", group: "Palette", shortcut: "mod+k", run: () => undefined },
  { id: "palette:search", title: "Open command palette (search)", group: "Palette", shortcut: "/", run: () => undefined },
];
