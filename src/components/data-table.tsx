import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, Columns3 } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import type { Breakpoint } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** The header becomes a button that cycles ascending, descending, unsorted. The app does the sorting. */
  sortable?: boolean;
  /** A CSS length or an fr value such as "12rem" or "2fr". Default "1fr" (at least 8rem). */
  width?: string;
  align?: "start" | "end";
  /** The column is hidden below this breakpoint. */
  hideBelow?: Breakpoint;
  /**
   * Whether the column menu may turn it off.
   * @default true
   */
  hideable?: boolean;
}

export interface Sort {
  columnId: string;
  direction: "asc" | "desc";
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
  /** Column id to visible; an absent id is visible. */
  columnVisibility?: Record<string, boolean>;
  /** Giving this shows a "Columns" menu. */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
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
  /** More rows exist; `onLoadMore` is called when the end scrolls into view. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Below `cardsBelow` the table is replaced by a list of these cards. */
  renderCard?: (row: T) => ReactNode;
  /** @default "md" */
  cardsBelow?: Breakpoint;
  className?: string;
}

const VIRTUALIZE_ABOVE = 100;
const OVERSCAN = 8;
const CHECK_WIDTH = "2.25rem";
const MIN_FR = "8rem";
const NEAR_END_PX = 400;

function trackOf(c: { width?: string }): string {
  const w = c.width ?? "1fr";
  return w.endsWith("fr") ? `minmax(${MIN_FR}, ${w})` : w;
}
function minOf(c: { width?: string }): string {
  const w = c.width ?? "1fr";
  return w.endsWith("fr") ? MIN_FR : w;
}

function ColumnMenu<T>({ columns, visibility, onChange }: { columns: Column<T>[]; visibility: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  const hideable = columns.filter((c) => c.hideable !== false);
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button icon={<Columns3 aria-hidden="true" className="size-4" />}>Columns</Button>} />
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
  columnVisibility,
  onColumnVisibilityChange,
  activeKey = null,
  onActiveKeyChange,
  onRowClick,
  selectedKeys,
  onSelectedKeysChange,
  loading = false,
  empty,
  error,
  hasMore = false,
  onLoadMore,
  renderCard,
  cardsBelow = "md",
  className,
}: DataTableProps<T>) {
  const uid = useId();
  const up = { sm: useMinWidth("sm"), md: useMinWidth("md"), lg: useMinWidth("lg") };
  const cards = renderCard !== undefined && !up[cardsBelow];
  const selectable = selectedKeys !== undefined && onSelectedKeysChange !== undefined;
  const shown = columns.filter((c) => columnVisibility?.[c.id] !== false && (c.hideBelow === undefined || up[c.hideBelow]));

  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(600);
  const [rowH, setRowH] = useState(28);
  useLayoutEffect(() => {
    setRowH(1.75 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setViewport(el.clientHeight || 600));
    ro.observe(el);
    setViewport(el.clientHeight || 600);
    return () => ro.disconnect();
  }, []);

  const virtual = !cards && rows.length > VIRTUALIZE_ABOVE;
  const first = virtual ? Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN) : 0;
  const last = virtual ? Math.min(rows.length, Math.ceil((scrollTop + viewport) / rowH) + OVERSCAN) : rows.length;
  const visibleRows = rows.slice(first, last);

  const checkNearEnd = useCallback(() => {
    const el = scroller.current;
    if (el && hasMore && !loading && onLoadMore && el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_END_PX) onLoadMore();
  }, [hasMore, loading, onLoadMore]);
  useEffect(checkNearEnd, [checkNearEnd, rows.length]);

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

  const toggleKey = (key: string) => {
    if (!selectable) return;
    const next = new Set(selectedKeys);
    if (!next.delete(key)) next.add(key);
    onSelectedKeysChange(next);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const page = Math.max(1, Math.floor(viewport / rowH) - 2);
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

  const template = [selectable ? CHECK_WIDTH : null, ...shown.map(trackOf)].filter(Boolean).join(" ");
  const minWidth = `calc(${[selectable ? CHECK_WIDTH : null, ...shown.map(minOf)].filter(Boolean).join(" + ")})`;
  const rowStyle: CSSProperties = { gridTemplateColumns: template };
  const allKeys = rows.map(rowKey);
  const selectedCount = selectable ? allKeys.filter((k) => selectedKeys.has(k)).length : 0;

  const body = (): ReactNode => {
    if (error) return <div role="alert" className="p-4 text-danger">{error}</div>;
    if (rows.length === 0 && loading) {
      return Array.from({ length: 8 }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex h-[var(--control-h)] items-center border-b border-line px-2">
          <div className="h-2 w-1/3 rounded bg-surface-raised" />
        </div>
      ));
    }
    if (rows.length === 0) return <div className="p-4 text-ink-muted">{empty}</div>;
    return null;
  };
  const stateBody = body();

  const rowClasses = (key: string) =>
    cn(
      "cursor-default border-b border-line",
      key === activeKey ? "bg-surface-raised" : selectedKeys?.has(key) ? "bg-surface" : "hover:bg-surface",
    );

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {onColumnVisibilityChange && !cards ? (
        <div className="flex justify-end pb-2">
          <ColumnMenu columns={columns} visibility={columnVisibility ?? {}} onChange={onColumnVisibilityChange} />
        </div>
      ) : null}
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
        className="panel min-h-0 flex-1 overflow-auto outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-ink-muted"
      >
        {cards ? (
          <div>
            {stateBody ??
              rows.map((row) => {
                const key = rowKey(row);
                return (
                  <div
                    key={key}
                    id={rowId(key)}
                    role="option"
                    aria-selected={key === activeKey}
                    onClick={() => {
                      onActiveKeyChange?.(key);
                      onRowClick?.(row);
                    }}
                    className={cn("p-3", rowClasses(key))}
                  >
                    {renderCard?.(row)}
                  </div>
                );
              })}
          </div>
        ) : (
          <div role="presentation" style={{ minWidth }}>
            <div role="row" style={rowStyle} className="sticky top-0 z-10 grid h-[var(--control-h)] items-center border-b border-line bg-ground">
              {selectable ? (
                <div role="columnheader" className="flex items-center justify-center">
                  <Checkbox
                    aria-label="Select all rows"
                    checked={rows.length > 0 && selectedCount === rows.length}
                    indeterminate={selectedCount > 0 && selectedCount < rows.length}
                    onCheckedChange={(checked) => onSelectedKeysChange(checked ? new Set(allKeys) : new Set())}
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
                    className={cn("flex min-w-0 items-center px-2 text-ink-muted uppercase", c.align === "end" && "justify-end")}
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
                  </div>
                );
              })}
            </div>
            {stateBody ?? (
              <div role="rowgroup" style={virtual ? { height: rows.length * rowH, position: "relative" } : undefined}>
                <div style={virtual ? { transform: `translateY(${first * rowH}px)` } : undefined}>
                  {visibleRows.map((row, i) => {
                    const key = rowKey(row);
                    return (
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
                        className={cn("grid h-[var(--control-h)] items-center", rowClasses(key))}
                      >
                        {selectable ? (
                          <div role="gridcell" className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox aria-label="Select row" checked={selectedKeys.has(key)} onCheckedChange={() => toggleKey(key)} />
                          </div>
                        ) : null}
                        {shown.map((c) => (
                          <div key={c.id} role="gridcell" className={cn("min-w-0 truncate px-2", c.align === "end" && "text-right")}>
                            {c.cell(row)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {rows.length > 0 && loading ? <div className="p-2 text-ink-faint">Loading</div> : null}
      </div>
    </div>
  );
}
