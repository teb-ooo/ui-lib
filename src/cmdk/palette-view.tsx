import { ChevronRight, Loader2, Search, X } from "lucide-react";
import { isValidElement } from "react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { Button, Input, Kbd } from "@teb-ooo/ui";
import { highlightRuns } from "./fuzzy";
import type { PaletteModel, PaletteRow } from "./palette-model";
import type { Command, CommandIcon } from "./types";

export interface PaletteViewProps {
  model: PaletteModel;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  /** Index of the highlighted row, or -1. */
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onSelect: (row: PaletteRow) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Titles of the views above the current one, root first; the current view is last. Empty at the root. */
  breadcrumb: string[];
  onBreadcrumb: (depth: number) => void;
  /** Id of the row whose `run` is in flight. */
  pendingId: string | null;
  error: { title: string; message: string } | null;
  /** Unique id prefix for the listbox and its options. */
  id: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Closes the palette: shown as a button on phones, where the sheet covers the screen and there is no Esc key. */
  onClose?: () => void;
}

function renderIcon(icon: CommandIcon | undefined): ReactNode {
  if (icon === undefined || icon === null || icon === false || icon === true) return null;
  if (isValidElement(icon) || typeof icon === "string" || typeof icon === "number") return icon;
  if (typeof icon === "function" || (typeof icon === "object" && "$$typeof" in icon)) {
    const Icon = icon as React.ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
    return <Icon aria-hidden="true" className="size-4" />;
  }
  return null;
}

/** Splits a label into runs, wrapping the matched characters. */
function Highlighted({ label, indices }: { label: string; indices: number[] }) {
  if (indices.length === 0) return <>{label}</>;
  return (
    <>
      {highlightRuns(label, indices).map(([text, hit], i) =>
        hit ? (
          <span key={i} data-match="" className="text-ink underline underline-offset-2">
            {text}
          </span>
        ) : (
          <span key={i}>{text}</span>
        ),
      )}
    </>
  );
}

export function optionId(id: string, index: number): string {
  return `${id}-option-${index}`;
}

function Row({ row, props }: { row: PaletteRow; props: PaletteViewProps }) {
  const { command } = row;
  const active = row.index === props.activeIndex;
  const pending = props.pendingId === command.id;
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- options: focus stays in the search input (aria-activedescendant), which handles the keys
    <div
      id={optionId(props.id, row.index)}
      role="option"
      aria-label={command.hint ? `${row.label}, ${command.hint}` : row.label}
      aria-selected={active}
      aria-busy={pending || undefined}
      data-active={active || undefined}
      onClick={() => props.onSelect(row)}
      onMouseMove={() => {
        if (!active) props.onActiveChange(row.index);
      }}
      className={[
        "flex min-h-(--control-h) cursor-pointer items-center gap-3 px-3 text-ink-muted max-sm:min-h-11",
        active ? "bg-surface-raised text-ink" : "",
      ].join(" ")}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">{renderIcon(command.icon)}</span>
      <span className={command.hint ? "min-w-0 max-w-[60%] shrink-0 truncate" : "min-w-0 flex-1 truncate"}>
        <Highlighted label={row.label} indices={row.indices} />
      </span>
      {command.hint ? <span className="min-w-0 flex-1 truncate text-right text-ink-faint">{command.hint}</span> : null}
      {pending ? (
        <Loader2 aria-label="Running" role="img" className="size-4 shrink-0 animate-spin text-ink-muted motion-reduce:animate-none" />
      ) : command.shortcut ? (
        <Kbd shortcut={command.shortcut} className="shrink-0" />
      ) : command.children !== undefined ? (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-faint" />
      ) : null}
    </div>
  );
}

/**
 * The palette surface without the modal around it: breadcrumb, combobox input, grouped listbox, error row,
 * empty state. Stateless, so the gallery can render it statically.
 */
export function PaletteView(props: PaletteViewProps) {
  const { model, id } = props;
  const listboxId = `${id}-listbox`;
  const activeRow = model.rows[props.activeIndex];
  return (
    <div className="flex min-h-0 flex-col max-sm:h-full">
      {props.breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-1 text-ink-muted">
          {["Commands", ...props.breadcrumb].map((title, depth, all) => {
            const last = depth === all.length - 1;
            return (
              <span key={depth} className="flex items-center gap-1">
                {depth > 0 ? <ChevronRight aria-hidden="true" className="size-4" /> : null}
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {title}
                  </span>
                ) : (
                  <Button className="border-transparent" onClick={() => props.onBreadcrumb(depth)}>
                    {title}
                  </Button>
                )}
              </span>
            );
          })}
        </nav>
      ) : null}
      <div className="flex items-center gap-2 border-b border-line px-3 py-1 max-sm:py-2">
        <Search aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
        <Input
          ref={props.inputRef}
          autoFocus
          role="combobox"
          aria-label="Search commands"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeRow ? optionId(id, activeRow.index) : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          value={props.query}
          placeholder={props.placeholder}
          onChange={(e) => props.onQueryChange(e.target.value)}
          onKeyDown={props.onKeyDown}
          className="border-0 bg-transparent px-0 text-ink focus:bg-transparent focus-visible:outline-none max-sm:min-h-11"
        />
        {props.onClose ? (
          <Button className="sm:hidden" icon={<X aria-hidden="true" className="size-4" />} aria-label="Close command palette" onClick={props.onClose} />
        ) : null}
      </div>
      {props.error ? (
        <div role="alert" className="border-b border-line px-3 py-2 text-danger">
          {props.error.title} failed: {props.error.message}
        </div>
      ) : null}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the listbox is driven from the search input through aria-activedescendant */}
      <div
        id={listboxId}
        role="listbox"
        aria-label="Commands"
        className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain py-1 max-sm:max-h-none max-sm:min-h-0 max-sm:flex-1"
        onMouseDown={(e) => e.preventDefault()}
      >
        {model.sections.map((section, s) => (
          <div key={`${section.group}:${s}`} role="group" aria-labelledby={`${id}-group-${s}`}>
            <div id={`${id}-group-${s}`} role="presentation" className="px-3 pb-1 pt-2 text-ink-faint">
              {section.group}
            </div>
            {section.rows.map((row) => (
              <Row key={row.command.id + (row.fallback ? ":fallback" : "")} row={row} props={props} />
            ))}
            {section.status ? (
              <div role="status" className={section.status === "loading" ? "anim-delayed px-3 py-1 text-ink-faint" : "px-3 py-1 text-ink-faint"}>
                {section.status === "loading" ? "Searching..." : `Could not search ${section.group.toLowerCase()}`}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {model.rows.length === 0 && !model.sections.some((s) => s.status === "loading") ? (
        <div role="status" className="px-3 py-6 text-center text-ink-muted">
          No results
        </div>
      ) : null}
      <div className="flex items-center gap-3 border-t border-line px-3 py-2 text-ink-faint max-sm:hidden" aria-hidden="true">
        <span className="flex items-center gap-1">
          <Kbd shortcut="up" />
          <Kbd shortcut="down" /> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd shortcut="enter" /> run
        </span>
        <span className="flex items-center gap-1">
          <Kbd shortcut="esc" /> close
        </span>
      </div>
    </div>
  );
}

export type { Command };
