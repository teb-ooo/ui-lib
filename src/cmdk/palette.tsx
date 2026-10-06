import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import { Dialog } from "@teb-ooo/ui";
import { useInternals } from "./context";
import { errorMessage } from "./execute";
import { useMediaQuery } from "../hooks/use-media-query";
import { SHEET_QUERY, useVisualViewportVars } from "./hooks";
import { useSourceResults } from "./use-source-results";
import { buildPaletteModel } from "./palette-model";
import type { PaletteRow } from "./palette-model";
import { optionId, PaletteView } from "./palette-view";
import { useFormStep } from "./form-step";
import type { Command, CommandForm } from "./types";

interface View {
  title: string;
  commands: Command[];
  /** A form to step through in this view, instead of a list of commands. */
  form?: CommandForm;
}

// Below 640px the top-placed panel becomes a full-height sheet. `max-sm:` variants are emitted after the
// panel's own utilities, so they win without any important flag. The height follows the visual viewport, so the
// on-screen keyboard does not cover the results (see `useVisualViewportVars`).
const SHEET =
  "max-sm:top-(--command-vv-top,0px) max-sm:left-0 max-sm:h-(--command-vv-height,100dvh) max-sm:w-screen " +
  "max-sm:max-w-none max-sm:translate-x-0 max-sm:rounded-none max-sm:border-0 motion-reduce:transition-none " +
  // The palette is mounted already open, so the popup's own open transition never runs: it arrives with a keyframe, at
  // scale 1.2, shrinking to 1 while it fades in.
  "anim-palette";

/** The modal palette. Mounted by the provider only while open, so all its state resets on every open. */
export function Palette() {
  const { registry, sources, getCommands, recents, run, close, initial } = useInternals("Palette");
  // Re-render when a route registers or removes commands while the palette is open.
  useSyncExternalStore(registry.subscribe, registry.getVersion);
  const sourcesVersion = useSyncExternalStore(sources.subscribe, sources.getVersion);

  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<View[]>(initial.stack ?? []);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(initial.error ?? null);
  const sheet = useMediaQuery(SHEET_QUERY);
  useVisualViewportVars(sheet);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const root = stack.length === 0;
  const top = stack[stack.length - 1];
  const step = useFormStep(top?.form, query, setQuery, close);
  const external = useSourceResults(sources, query, root, sourcesVersion);
  const listModel = buildPaletteModel({
    query,
    commands: top ? top.commands : getCommands(),
    recents,
    root,
    external,
  });
  const model = step ? step.model : listModel;
  const activeIndex = model.rows.length === 0 ? -1 : Math.min(active, model.rows.length - 1);
  // A new step of a form starts on its first row: the submit row of the review, the first option of a list.
  const stepLabel = step?.stepLabel;
  useEffect(() => {
    setActive(0);
  }, [stepLabel]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(optionId(id, activeIndex));
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id]);

  const pushView = (view: View): void => {
    setStack((s) => [...s, view]);
    setQuery("");
    setActive(0);
  };

  const select = (row: PaletteRow): void => {
    if (step) {
      step.select(row);
      return;
    }
    if (pending !== null) return;
    setError(null);
    const out = run(row.command, query, row.fallback);
    if (out instanceof Promise) {
      setPending(row.command.id);
      out.then(
        (o) => {
          if (!mounted.current) return;
          setPending(null);
          if (o.kind === "view") pushView({ title: o.title, commands: o.commands });
          else if (o.kind === "form") pushView({ title: o.form.title, commands: [], form: o.form });
          else close();
        },
        (err: unknown) => {
          if (!mounted.current) return;
          setPending(null);
          setError({ title: row.command.title, message: errorMessage(err) });
        },
      );
    } else if (out.kind === "view") {
      pushView({ title: out.title, commands: out.commands });
    } else if (out.kind === "form") {
      pushView({ title: out.form.title, commands: [], form: out.form });
    } else {
      close();
    }
  };

  const goBackTo = (depth: number): void => {
    setStack((s) => s.slice(0, depth));
    setQuery("");
    setActive(0);
    setError(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.nativeEvent.isComposing) return;
    const n = model.rows.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (n > 0) setActive((activeIndex + 1) % n);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (n > 0) setActive((activeIndex - 1 + n) % n);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        if (n > 0) setActive(n - 1);
        break;
      case "Enter": {
        e.preventDefault();
        if (step?.typing) {
          step.enter(query);
          break;
        }
        const row = model.rows[activeIndex];
        if (row) select(row);
        break;
      }
      case "Backspace":
        if (query === "" && stack.length > 0) {
          e.preventDefault();
          // In a form, Backspace on nothing goes back a step; from the first step it leaves the form.
          if (!step?.back()) goBackTo(stack.length - 1);
        }
        break;
      default:
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title="Command palette"
      placement="top"
      bare
      inverted
      initialFocus={inputRef}
      className={SHEET}
    >
      <PaletteView
        id={id}
        model={model}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setActive(0);
          setError(null);
          step?.clearError();
        }}
        placeholder={step ? step.placeholder : top ? `Search ${top.title.replace(/\.{3}$/u, "")}` : "Type a command or search"}
        activeIndex={activeIndex}
        onActiveChange={setActive}
        onSelect={select}
        onKeyDown={onKeyDown}
        breadcrumb={step ? [...stack.map((v) => v.title), step.stepLabel] : stack.map((v) => v.title)}
        onBreadcrumb={(depth) => {
          if (depth < stack.length) goBackTo(depth);
        }}
        pendingId={step ? step.pendingId : pending}
        error={step ? step.error : error}
        {...(step ? { inputLabel: step.inputLabel, note: step.note, enterLabel: step.typing ? "next" : "choose", ...(step.typing ? { emptyMessage: null } : {}) } : {})}
        inputRef={inputRef}
        onClose={close}
      />
    </Dialog>
  );
}
