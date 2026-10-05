import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Columns3 } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import type { Breakpoint } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { readStoredJson, writeStoredJson } from "../lib/storage";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Select } from "./select";

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** The header becomes a button that cycles ascending, descending, unsorted. The app does the sorting. */
  sortable?: boolean;
  /** A CSS length or an fr value such as "12rem" or "2fr". Default "1fr" (at least 8rem). */
  width?: string;
  align?: "start" | "end";
  /**
   * How many lines the cell may take before it is cut with an ellipsis. With 2 or 3 the rows of a table of up to 100 rows
   * grow to fit (a list of sentences); above 100 rows the table is windowed on a fixed row height and every cell is one line.
   * @default 1
   */
  lines?: 1 | 2 | 3;
  /**
   * The column is hidden while the table itself is narrower than this: sm 24rem, md 36rem, lg 48rem (the table's
   * width, not the screen's, so a narrow list pane drops columns by itself).
   */
  hideBelow?: Breakpoint;
  /**
   * Whether the column menu may turn it off.
   * @default true
   */
  hideable?: boolean;
  /** Set false to keep this column's width fixed when the table is `resizable`. */
  resizable?: boolean;
}

export interface Sort {
  columnId: string;
  direction: "asc" | "desc";
}

export interface Pagination {
  /** The page shown, counting from 0. */
  page: number;
  pageSize: number;
  /** Rows matching the filters on the server, not the rows loaded. */
  total: number;
  /** The total is a count up to a limit ("500+"): Next stays on while a full page was returned. */
  totalIsLowerBound?: boolean;
  /**
   * For a list the server pages with a cursor: whether another page exists (the server sent a next cursor). When given it
   * decides Next, instead of "a full page was returned" or the total. Pair it with `total` as the rows seen so far and
   * `totalIsLowerBound` set to this value.
   */
  hasNext?: boolean;
  onPageChange: (page: number) => void;
  /** Giving this with `pageSizes` adds a rows-per-page select. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: number[];
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Accessible name of the table. */
  label: string;
  /** Controlled sort. The table only shows the state and reports changes; the app sorts, in memory or on the server. */
  sort?: Sort | null;
  onSortChange?: (sort: Sort | null) => void;
  /** Column id to visible; an absent id is visible. Controlled: when given, it wins over the saved configuration. */
  columnVisibility?: Record<string, boolean>;
  /** Called when the Columns menu changes a column. Giving this, or `persistKey`, shows the "Columns" menu. */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  /**
   * Saves the column configuration in `localStorage` under this key (shared by every table with the same key) and
   * restores it on the next visit. Without `columnVisibility` the table keeps the state itself. Storage that is
   * unavailable or holds something unexpected is ignored.
   */
  persistKey?: string;
  /**
   * Lets a column be resized by dragging the right edge of its header (or focusing the handle and pressing Left and
   * Right; Home or a double-click resets). Widths are saved with `persistKey` when given, else kept in the table.
   * @default false
   */
  resizable?: boolean;
  /**
   * Show the Columns menu. By default it shows when `onColumnVisibilityChange` or `persistKey` is given; pass false to
   * keep saving columns and widths without the menu.
   */
  columnMenu?: boolean;
  /** The highlighted row, matched by key so it survives a re-sort or a refetch. It usually drives a detail pane. */
  activeKey?: string | null;
  onActiveKeyChange?: (key: string) => void;
  /** Called on a click, and on Enter for the active row. */
  onRowClick?: (row: T) => void;
  /** Giving this adds a checkbox column. */
  selectedKeys?: ReadonlySet<string>;
  onSelectedKeysChange?: (keys: ReadonlySet<string>) => void;
  /** Skeleton rows while there are none, otherwise a "Loading" line at the end. */
  loading?: boolean;
  /** Shown when there are no rows and nothing is loading. */
  empty?: ReactNode;
  /** Replaces the body. */
  error?: ReactNode;
  /** With `error`: adds a Retry button under the message that calls this. */
  onRetry?: () => void;
  /** Label of the retry button. @default "Retry" */
  retryLabel?: string;
  /** More rows exist; `onLoadMore` is called when the end scrolls into view. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /**
   * Pages instead of paging by scrolling: the table shows only the rows it is given (one page) and a footer under it
   * says "1-100 of 3455" with Previous and Next. `onLoadMore` and `hasMore` are not used. Alt+PageUp and Alt+PageDown
   * change page from the grid.
   */
  pagination?: Pagination;
  /** Below `cardsBelow` (a screen width) the table is replaced by a list of these cards. */
  renderCard?: (row: T) => ReactNode;
  /** @default "md" */
  cardsBelow?: Breakpoint;
  /**
   * Edge to edge: no outer border, radius or background, and the header rule and row dividers run the full width. The text is
   * inset to the page gutter (16px, 24px from md) like the `Container` text above it.
   * @default false
   */
  bleed?: boolean;
  /**
   * The table is only as tall as its header and rows (at least the header and two rows), shrinks to the space its parent
   * leaves and then scrolls inside itself. Without it the table fills the height of its parent. In a parent that scrolls it is
   * simply as tall as its rows.
   * @default false
   */
  fit?: boolean;
  className?: string;
}

const STORAGE_PREFIX = "teb-ui:data-table:";

function isFlagMap(parsed: unknown): parsed is Record<string, unknown> {
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
}

function readSaved(key: string | undefined): Record<string, boolean> {
  if (!key) return {};
  const parsed = readStoredJson(STORAGE_PREFIX + key);
  if (!isFlagMap(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).filter((e): e is [string, boolean] => typeof e[1] === "boolean"));
}

function writeSaved(key: string, value: Record<string, boolean>): void {
  writeStoredJson(STORAGE_PREFIX + key, value);
}

function readWidths(key: string | undefined): Record<string, number> {
  if (!key) return {};
  const parsed = readStoredJson(`${STORAGE_PREFIX}${key}:widths`);
  if (!isFlagMap(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0));
}

function writeWidths(key: string, value: Record<string, number>): void {
  writeStoredJson(`${STORAGE_PREFIX}${key}:widths`, value);
}

const MIN_COLUMN_REM = 4;
const NUDGE_PX = 16;

/** The drag handle on a header cell's right edge. It measures its cell, so `fr` widths turn into pixels on the first move. */
function ResizeHandle({
  label,
  minPx,
  onResize,
  onCommit,
  onReset,
}: {
  label: string;
  minPx: number;
  onResize: (px: number) => void;
  onCommit: () => void;
  onReset: () => void;
}) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const cellWidth = (el: HTMLElement) => el.parentElement?.offsetWidth ?? 0;
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label}`}
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={onReset}
      onPointerDown={(e) => {
        e.preventDefault();
        drag.current = { x: e.clientX, width: cellWidth(e.currentTarget) };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d) onResize(Math.max(minPx, Math.round(d.width + e.clientX - d.x)));
      }}
      onPointerUp={() => {
        if (drag.current) onCommit();
        drag.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "Home") onReset();
        else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          onResize(Math.max(minPx, cellWidth(e.currentTarget) + (e.key === "ArrowRight" ? NUDGE_PX : -NUDGE_PX)));
          onCommit();
        } else return;
        e.preventDefault();
      }}
      className="group absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none outline-none"
    >
      <span className="mx-auto block h-full w-px bg-transparent group-hover:bg-ink-muted group-focus-visible:bg-ink-muted" />
    </div>
  );
}

const VIRTUALIZE_ABOVE = 100;
const OVERSCAN = 8;
const CHECK_WIDTH = "2.25rem";
const MIN_FR = "8rem";
const NEAR_END_PX = 400;
/** Table widths, in rem, at which `hideBelow` columns appear. */
const COLUMN_WIDTHS: Record<Breakpoint, number> = { sm: 24, md: 36, lg: 48 };

function trackOf(c: { width?: string }): string {
  const w = c.width ?? "1fr";
  return w.endsWith("fr") ? `minmax(${MIN_FR}, ${w})` : w;
}
function minOf(c: { width?: string }): string {
  const w = c.width ?? "1fr";
  return w.endsWith("fr") ? MIN_FR : w;
}

function ColumnMenu<T>({
  columns,
  visibility,
  onChange,
  hiddenByWidth,
}: {
  columns: Column<T>[];
  visibility: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
  hiddenByWidth: number;
}) {
  const hideable = columns.filter((c) => c.hideable !== false);
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button icon={<Columns3 aria-hidden="true" className="size-4" />} tip="Columns" className="border-transparent" />} />
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="anim-fade panel panel-float min-w-40 p-1 text-ink outline-none">
            {hideable.map((c) => (
              <Menu.CheckboxItem
                key={c.id}
                checked={visibility[c.id] !== false}
                onCheckedChange={(checked) => onChange({ ...visibility, [c.id]: checked })}
                closeOnClick={false}
                className="flex h-[var(--control-h)] cursor-pointer items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised"
              >
                <span className="flex size-4 items-center justify-center">
                  <Menu.CheckboxItemIndicator>
                    <Check aria-hidden="true" className="size-3" />
                  </Menu.CheckboxItemIndicator>
                </span>
                {c.header}
              </Menu.CheckboxItem>
            ))}
            {hiddenByWidth > 0 ? (
              <p className="border-t border-line px-2 pt-2 pb-1 text-ink-faint">
                {hiddenByWidth} {hiddenByWidth === 1 ? "column is" : "columns are"} hidden: the table is too narrow.
              </p>
            ) : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * A dense, keyboard-driven table for many rows: sticky header, sortable columns, column menu, checkbox selection,
 * an active row, cursor paging and windowing past 100 rows. Below `cardsBelow` it can show cards instead.
 * It fills the height of its parent and scrolls inside it, so give the parent a height (for example `flex-1 min-h-0`).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  sort = null,
  onSortChange,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  persistKey,
  resizable = false,
  columnMenu,
  activeKey = null,
  onActiveKeyChange,
  onRowClick,
  selectedKeys,
  onSelectedKeysChange,
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel = "Retry",
  hasMore = false,
  onLoadMore,
  renderCard,
  cardsBelow = "md",
  bleed = false,
  fit = false,
  pagination,
  className,
}: DataTableProps<T>) {
  const uid = useId();
  const wideScreen = useMinWidth(cardsBelow);
  const cards = renderCard !== undefined && !wideScreen;
  const selectable = selectedKeys !== undefined && onSelectedKeysChange !== undefined;
  const [saved, setSaved] = useState(() => readSaved(persistKey));
  useEffect(() => setSaved(readSaved(persistKey)), [persistKey]);
  const columnVisibility = controlledVisibility ?? saved;
  const changeVisibility = (next: Record<string, boolean>) => {
    setSaved(next);
    if (persistKey) writeSaved(persistKey, next);
    onColumnVisibilityChange?.(next);
  };
  const hasColumnMenu = columnMenu ?? (onColumnVisibilityChange !== undefined || persistKey !== undefined);
  const [widths, setWidths] = useState(() => readWidths(persistKey));
  const widthsRef = useRef(widths);
  useEffect(() => {
    const next = readWidths(persistKey);
    widthsRef.current = next;
    setWidths(next);
  }, [persistKey]);
  const changeWidth = (id: string, px: number | null) => {
    const next = { ...widthsRef.current };
    if (px === null) delete next[id];
    else next[id] = px;
    widthsRef.current = next;
    setWidths(next);
  };
  const commitWidths = () => {
    if (persistKey) writeWidths(persistKey, widthsRef.current);
  };

  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(600);
  const [width, setWidth] = useState(1024);
  const [rowH, setRowH] = useState(28);
  useLayoutEffect(() => {
    setRowH(1.75 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setViewport(el.clientHeight || 600);
      setWidth(el.clientWidth || 1024);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const widthRem = width / (rowH / 1.75);
  const fits = (c: Column<T>) => c.hideBelow === undefined || widthRem >= COLUMN_WIDTHS[c.hideBelow];
  const wanted = columns.filter((c) => columnVisibility[c.id] !== false);
  const shown = wanted.filter(fits);
  const hiddenByWidth = wanted.length - shown.length;

  const virtual = !cards && rows.length > VIRTUALIZE_ABOVE;
  const wraps = !virtual && shown.some((c) => (c.lines ?? 1) > 1);
  const first = virtual ? Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN) : 0;
  const last = virtual ? Math.min(rows.length, Math.ceil((scrollTop + viewport) / rowH) + OVERSCAN) : rows.length;
  const visibleRows = rows.slice(first, last);

  const checkNearEnd = useCallback(() => {
    const el = scroller.current;
    if (el && !pagination && hasMore && !loading && onLoadMore && el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_END_PX) onLoadMore();
  }, [hasMore, loading, onLoadMore, pagination]);
  useEffect(checkNearEnd, [checkNearEnd, rows.length]);
  // A new page starts at the top.
  const pageNow = pagination?.page;
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [pageNow]);

  const lastPage = pagination
    ? pagination.hasNext !== undefined
      ? !pagination.hasNext
      : pagination.totalIsLowerBound
        ? rows.length < pagination.pageSize
        : (pagination.page + 1) * pagination.pageSize >= pagination.total
    : true;
  const rangeStart = pagination ? pagination.page * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? rows.length > 0
      ? pagination.page * pagination.pageSize + rows.length
      : Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)
    : 0;
  const goToPage = (delta: number) => {
    if (!pagination) return;
    const next = pagination.page + delta;
    if (next < 0 || (delta > 0 && lastPage)) return;
    pagination.onPageChange(next);
  };

  const rowId = (key: string) => `${uid}-${key}`;
  const activeIndex = activeKey === null ? -1 : rows.findIndex((r) => rowKey(r) === activeKey);

  const activate = (i: number) => {
    const row = rows[Math.min(rows.length - 1, Math.max(0, i))];
    if (!row) return;
    const key = rowKey(row);
    onActiveKeyChange?.(key);
    const el = scroller.current;
    if (!el) return;
    if (virtual) {
      const idx = rows.indexOf(row);
      if (idx * rowH < el.scrollTop) el.scrollTop = idx * rowH;
      else if ((idx + 2) * rowH > el.scrollTop + el.clientHeight) el.scrollTop = (idx + 2) * rowH - el.clientHeight;
    } else {
      document.getElementById(rowId(key))?.scrollIntoView?.({ block: "nearest" });
    }
  };

  // Range selection, like a mail client. The anchor is the row last toggled; `extent` remembers what a keyboard
  // extension (Shift+Up/Down) added, so moving back shrinks it again.
  const anchor = useRef<string | null>(null);
  const extent = useRef<{ anchor: string; added: Set<string> } | null>(null);
  const keysBetween = (a: string, b: string): string[] | null => {
    const i = rows.findIndex((r) => rowKey(r) === a);
    const j = rows.findIndex((r) => rowKey(r) === b);
    return i < 0 || j < 0 ? null : rows.slice(Math.min(i, j), Math.max(i, j) + 1).map(rowKey);
  };
  const toggleKey = (key: string) => {
    if (!selectable) return;
    const next = new Set(selectedKeys);
    if (!next.delete(key)) next.add(key);
    anchor.current = key;
    extent.current = null;
    onSelectedKeysChange(next);
  };
  /** The header box works on this page's rows only; selections made elsewhere stay. */
  const selectAll = (checked: boolean) => {
    if (!selectable) return;
    const next = new Set(selectedKeys);
    for (const k of allKeys) {
      if (checked) next.add(k);
      else next.delete(k);
    }
    anchor.current = null;
    extent.current = null;
    onSelectedKeysChange(next);
  };
  /** Shift+click: every row from the anchor to this one takes the anchor row's state (selected adds, unselected removes). */
  const rangeTo = (key: string) => {
    if (!selectable) return;
    const a = anchor.current;
    const between = a === null ? null : keysBetween(a, key);
    if (a === null || between === null) return toggleKey(key);
    const next = new Set(selectedKeys);
    const on = selectedKeys.has(a);
    for (const k of between) {
      if (on) next.add(k);
      else next.delete(k);
    }
    extent.current = null;
    onSelectedKeysChange(next);
  };
  /** Shift+Up/Down: select from the anchor to the row at `index`, undoing what the previous step added. */
  const extendTo = (index: number, from: string | null) => {
    const row = rows[index];
    if (!selectable || !row) return;
    const toKey = rowKey(row);
    const anchorKey = extent.current?.anchor ?? anchor.current ?? from ?? toKey;
    const between = keysBetween(anchorKey, toKey) ?? [toKey];
    const base = new Set(selectedKeys);
    for (const k of extent.current?.added ?? []) base.delete(k);
    const added = new Set(between.filter((k) => !base.has(k)));
    for (const k of between) base.add(k);
    anchor.current = anchorKey;
    extent.current = { anchor: anchorKey, added };
    onSelectedKeysChange(base);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const page = Math.max(1, Math.floor(viewport / rowH) - 2);
    if (e.altKey && (e.key === "PageDown" || e.key === "PageUp")) {
      if (pagination) {
        e.preventDefault();
        goToPage(e.key === "PageDown" ? 1 : -1);
      }
      return;
    }
    if (e.shiftKey && selectable && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const target = Math.min(rows.length - 1, Math.max(0, e.key === "ArrowDown" ? activeIndex + 1 : activeIndex < 0 ? 0 : activeIndex - 1));
      const current = rows[activeIndex];
      activate(target);
      extendTo(target, current ? rowKey(current) : null);
      return;
    }
    if (e.shiftKey && selectable && e.key === " ") {
      e.preventDefault();
      const row = rows[activeIndex];
      if (row) rangeTo(rowKey(row));
      return;
    }
    const actions: Record<string, () => void> = {
      ArrowDown: () => activate(activeIndex + 1),
      ArrowUp: () => activate(activeIndex < 0 ? 0 : activeIndex - 1),
      PageDown: () => activate(activeIndex + page),
      PageUp: () => activate(activeIndex - page),
      Home: () => activate(0),
      End: () => activate(rows.length - 1),
      Enter: () => {
        const row = rows[activeIndex];
        if (row) onRowClick?.(row);
      },
      " ": () => {
        const row = rows[activeIndex];
        if (row) toggleKey(rowKey(row));
      },
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const cycleSort = (c: Column<T>) => {
    if (!onSortChange) return;
    if (sort?.columnId !== c.id) onSortChange({ columnId: c.id, direction: "asc" });
    else if (sort.direction === "asc") onSortChange({ columnId: c.id, direction: "desc" });
    else onSortChange(null);
  };

  // The Columns button is the last cell of the header row, so every row carries one more (empty) track.
  const menuCell = hasColumnMenu && !cards;
  const template = [
    selectable ? CHECK_WIDTH : null,
    ...shown.map((c) => (widths[c.id] !== undefined ? `${widths[c.id]}px` : trackOf(c))),
    menuCell ? CHECK_WIDTH : null,
  ]
    .filter(Boolean)
    .join(" ");
  const minWidth = `calc(${[selectable ? CHECK_WIDTH : null, ...shown.map((c) => (widths[c.id] !== undefined ? `${widths[c.id]}px` : minOf(c))), menuCell ? CHECK_WIDTH : null, bleed ? "1rem" : null].filter(Boolean).join(" + ")})`;
  const rowStyle: CSSProperties = { gridTemplateColumns: template };
  const allKeys = rows.map(rowKey);
  const selectedCount = selectable ? allKeys.filter((k) => selectedKeys.has(k)).length : 0;

  const body = (): ReactNode => {
    if (error)
      return (
        <div className="flex flex-col items-start gap-2 p-4">
          <div role="alert" className="text-danger">
            {error}
          </div>
          {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
        </div>
      );
    if (rows.length === 0 && loading) {
      return Array.from({ length: 8 }, (_, i) => (
        <div key={i} aria-hidden="true" className="anim-delayed flex h-[var(--control-h)] items-center border-b border-line px-2">
          <div className="h-2 w-1/3 rounded bg-surface-raised" />
        </div>
      ));
    }
    // Text gets the table's own padding; an EmptyState brings its own, so it is only lined up with the first column.
    if (rows.length === 0) {
      const text = typeof empty === "string" || typeof empty === "number";
      return <div className={text ? "px-2 py-4 text-ink-muted" : "[&>[role=status]]:px-2"}>{empty}</div>;
    }
    return null;
  };
  const stateBody = body();

  // Rows that do something on click look it: a pointer and a visible hover. The active row has its own marker
  // (a bar on its left edge), so hover and active are never the same look.
  const clickable = onRowClick !== undefined || onActiveKeyChange !== undefined;
  const rowClasses = (key: string) =>
    cn(
      "border-b border-line",
      clickable ? "cursor-pointer" : "cursor-default",
      key === activeKey
        ? "bg-surface-raised shadow-[inset_2px_0_0_0_var(--color-ink-muted)]"
        : cn(selectedKeys?.has(key) && "bg-surface", clickable ? "hover:bg-surface-raised" : "hover:bg-surface"),
    );

  return (
    <div
      {...(bleed ? { "data-bleed": "" } : {})}
      style={fit ? { minHeight: "calc(var(--control-h) * 3)" } : undefined}
      className={cn("flex min-h-0 flex-col", fit ? "max-h-full flex-initial" : "h-full", className)}
    >
      <div className={cn("flex min-h-0 flex-col", fit ? "flex-initial" : "flex-1", pagination && !bleed && "panel overflow-hidden")}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the scroll region forwards the grid's keyboard handling; the grid role is on the inner element */}
        <div
          ref={scroller}
          tabIndex={0}
          role={cards ? "listbox" : "grid"}
          aria-label={label}
          aria-busy={loading}
          aria-rowcount={cards ? undefined : rows.length + 1}
          aria-activedescendant={activeIndex >= 0 && activeIndex >= first && activeIndex < last ? rowId(rowKey(rows[activeIndex] as T)) : undefined}
          onScroll={(e) => {
            setScrollTop(e.currentTarget.scrollTop);
            checkNearEnd();
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "min-h-0 overflow-auto outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ink-muted",
            fit ? "flex-initial" : "flex-1",
            !bleed && !pagination && "panel",
          )}
        >
          {cards ? (
            <div>
              {selectable && !stateBody ? (
                <div className={cn("flex h-[var(--control-h)] items-center gap-3 border-b border-line", bleed ? "px-4 md:px-6" : "px-3")}>
                  <Checkbox
                    aria-label="Select all rows"
                    checked={rows.length > 0 && selectedCount === rows.length}
                    indeterminate={selectedCount > 0 && selectedCount < rows.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-ink-muted">{selectedCount > 0 ? `${selectedCount} selected` : "Select all"}</span>
                </div>
              ) : null}
              {stateBody ??
                rows.map((row) => {
                  const key = rowKey(row);
                  return (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- card options: focus stays on the list (aria-activedescendant), which handles the keys
                    <div
                      key={key}
                      id={rowId(key)}
                      role="option"
                      aria-selected={key === activeKey}
                      onClick={() => {
                        onActiveKeyChange?.(key);
                        onRowClick?.(row);
                      }}
                      className={cn(bleed ? "px-4 py-3 md:px-6" : "p-3", rowClasses(key))}
                    >
                      {selectable ? (
                        <div className="flex gap-3">
                          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- only stops the click reaching the row; the checkbox inside is the control */}
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox aria-label="Select row" checked={selectedKeys.has(key)} onCheckedChange={() => toggleKey(key)} />
                          </div>
                          <div className="min-w-0 flex-1">{renderCard?.(row)}</div>
                        </div>
                      ) : (
                        renderCard?.(row)
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div role="presentation" style={{ minWidth }}>
              <div
                role="row"
                style={rowStyle}
                className={cn("sticky top-0 z-10 grid h-[var(--control-h)] items-center border-b border-line bg-ground", bleed && "px-2 md:px-4")}
              >
                {selectable ? (
                  <div role="columnheader" className="flex items-center justify-center">
                    <Checkbox
                      aria-label="Select all rows"
                      checked={rows.length > 0 && selectedCount === rows.length}
                      indeterminate={selectedCount > 0 && selectedCount < rows.length}
                      onCheckedChange={selectAll}
                    />
                  </div>
                ) : null}
                {shown.map((c) => {
                  const dir = sort?.columnId === c.id ? sort.direction : null;
                  return (
                    <div
                      key={c.id}
                      role="columnheader"
                      aria-sort={c.sortable ? (dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none") : undefined}
                      className={cn("relative flex min-w-0 items-center px-2 text-ink-muted uppercase", c.align === "end" && "justify-end")}
                    >
                      {c.sortable ? (
                        <Button
                          className="-mx-2 border-transparent uppercase"
                          onClick={() => cycleSort(c)}
                          icon={
                            dir === "asc" ? (
                              <ArrowUp aria-hidden="true" className="size-3" />
                            ) : dir === "desc" ? (
                              <ArrowDown aria-hidden="true" className="size-3" />
                            ) : (
                              <ChevronsUpDown aria-hidden="true" className="size-3" />
                            )
                          }
                        >
                          {c.header}
                        </Button>
                      ) : (
                        <span className="truncate">{c.header}</span>
                      )}
                      {resizable && c.resizable !== false ? (
                        <ResizeHandle
                          label={typeof c.header === "string" ? c.header : c.id}
                          minPx={MIN_COLUMN_REM * (rowH / 1.75)}
                          onResize={(px) => changeWidth(c.id, px)}
                          onCommit={commitWidths}
                          onReset={() => {
                            changeWidth(c.id, null);
                            commitWidths();
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
                {menuCell ? (
                  <div role="columnheader" aria-label="Columns" className="flex items-center justify-center">
                    <ColumnMenu columns={columns} visibility={columnVisibility} onChange={changeVisibility} hiddenByWidth={hiddenByWidth} />
                  </div>
                ) : null}
              </div>
              {stateBody ?? (
                <div role="rowgroup" style={virtual ? { height: rows.length * rowH, position: "relative" } : undefined}>
                  <div style={virtual ? { transform: `translateY(${first * rowH}px)` } : undefined}>
                    {visibleRows.map((row, i) => {
                      const key = rowKey(row);
                      return (
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- grid rows: focus stays on the grid (aria-activedescendant), which handles the keys
                        <div
                          key={key}
                          id={rowId(key)}
                          role="row"
                          aria-rowindex={first + i + 2}
                          aria-selected={key === activeKey}
                          style={rowStyle}
                          onClick={() => {
                            onActiveKeyChange?.(key);
                            onRowClick?.(row);
                          }}
                          className={cn("grid items-center", wraps ? "min-h-[var(--control-h)] py-1" : "h-[var(--control-h)]", bleed && "px-2 md:px-4", rowClasses(key))}
                        >
                          {selectable ? (
                            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- the select cell holds a checkbox, which is the focusable control
                            <div
                              role="gridcell"
                              className="flex items-center justify-center select-none"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDownCapture={(e) => {
                                if (e.shiftKey) e.preventDefault(); // no text selection while extending
                              }}
                              onClickCapture={(e) => {
                                if (!e.shiftKey) return;
                                e.preventDefault();
                                e.stopPropagation();
                                rangeTo(key);
                              }}
                            >
                              <Checkbox aria-label="Select row" checked={selectedKeys.has(key)} onCheckedChange={() => toggleKey(key)} />
                            </div>
                          ) : null}
                          {shown.map((c) => (
                            <div key={c.id} role="gridcell" className={cn("min-w-0 px-2", !virtual && c.lines === 2 ? "line-clamp-2 break-words" : !virtual && c.lines === 3 ? "line-clamp-3 break-words" : "truncate", c.align === "end" && "text-right")}>
                              {c.cell(row)}
                            </div>
                          ))}
                          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- an empty cell that holds the row menu's place in the grid */}
                          {menuCell ? <div role="gridcell" /> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {rows.length > 0 && loading ? <div className="anim-delayed p-2 text-ink-faint">Loading</div> : null}
        </div>
        {pagination ? (
          <div
            role="navigation"
            aria-label="Pagination"
            className={cn("flex shrink-0 flex-wrap items-center gap-2 border-t border-line py-1", bleed ? "px-4 md:px-6" : "px-2")}
          >
            <span aria-live="polite" className="text-ink-muted">
              {pagination.total === 0 ? "0 of 0" : `${rangeStart}-${rangeEnd} of ${pagination.total}${pagination.totalIsLowerBound ? "+" : ""}`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {pagination.onPageSizeChange && pagination.pageSizes ? (
                <div className="w-24">
                  <Select
                    label="Rows per page"
                    options={pagination.pageSizes.map((n) => ({
                      value: String(n),
                      label: String(n),
                    }))}
                    value={String(pagination.pageSize)}
                    onValueChange={(v) => v && pagination.onPageSizeChange?.(Number(v))}
                  />
                </div>
              ) : null}
              <Button
                icon={<ChevronLeft aria-hidden="true" className="size-4" />}
                tip="Previous page"
                disabled={pagination.page <= 0}
                onClick={() => goToPage(-1)}
              />
              <Button icon={<ChevronRight aria-hidden="true" className="size-4" />} tip="Next page" disabled={lastPage} onClick={() => goToPage(1)} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
