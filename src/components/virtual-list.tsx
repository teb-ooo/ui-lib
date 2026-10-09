import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useMeasuredHeights } from "../lib/use-measured-heights";
import { buildOffsets, fixedRange, measuredRange, scrollTopFor } from "../lib/virtual-window";

export interface VirtualListHandle {
  /** Scrolls so the item is on screen: `nearest` moves as little as possible (the default), `start` and `center` place it. */
  scrollToIndex: (index: number, align?: "nearest" | "start" | "center") => void;
}

export interface VirtualListProps<T> {
  /** What it is; the accessible name of the list. */
  label: string;
  items: readonly T[];
  /** A stable key for an item (an id), so rows keep their state and measured height when the list changes. */
  itemKey: (item: T, index: number) => string;
  /** Draws one item. The list wraps it in a `listitem`; draw only the content. It must not set its own outer margin. */
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * The height of every item in pixels, when they are all the same: it is then exact and nothing is measured. Leave it out
   * for items of different heights (wrapped text, cards): each rendered item is measured and `estimatedItemHeight` stands in
   * until it is.
   */
  itemHeight?: number;
  /** The height assumed for an item that has not been measured yet. @default 48 */
  estimatedItemHeight?: number;
  /** How many items beyond the visible ones are drawn on each side. @default 6 */
  overscan?: number;
  /** Shown instead of the list when there are no items. */
  empty?: ReactNode;
  /** Called when the scroll comes within `endThreshold` pixels of the end, for loading the next page. Once per length of the list. */
  onEndReached?: () => void;
  /** @default 240 */
  endThreshold?: number;
  /** Layout classes. The list fills its parent's height and scrolls inside it, so give it a height (`h-96`, `flex-1 min-h-0`). */
  className?: string;
}

/**
 * A list that draws only the items on screen, so ten thousand rows cost the same as thirty. It knows nothing about what an
 * item looks like: you give `renderItem`. Items are all one height (`itemHeight`, exact and cheapest) or measured as they
 * are drawn. It is a `list` of `listitem`s with their position set (`aria-posinset` of `aria-setsize`), so a screen reader
 * knows the whole length though most is not in the page. For tabular data use `DataTable`, which windows its rows the same way.
 */
function VirtualListInner<T>(
  { label, items, itemKey, renderItem, itemHeight, estimatedItemHeight = 48, overscan = 6, empty, onEndReached, endThreshold = 240, className }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(400);
  const { heights, version, watch } = useMeasuredHeights(itemHeight === undefined);
  const count = items.length;

  useEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setViewport(el.clientHeight || 400));
    ro.observe(el);
    setViewport(el.clientHeight || 400);
    return () => ro.disconnect();
  }, []);

  const keys = useMemo(() => items.map(itemKey), [items, itemKey]);
  // Measured mode: the offsets follow the measured heights; fixed mode needs none.
  const offsets = useMemo(
    () => (itemHeight === undefined ? buildOffsets(count, (i) => heights.get(keys[i]!), estimatedItemHeight) : null),
    // `version` is the signal that a height changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemHeight, count, keys, estimatedItemHeight, version],
  );
  const total = itemHeight !== undefined ? count * itemHeight : (offsets?.[count] ?? 0);
  const { first, last } =
    itemHeight !== undefined ? fixedRange(count, itemHeight, scrollTop, viewport, overscan) : measuredRange(offsets!, scrollTop, viewport, overscan);
  const topOf = (i: number) => (itemHeight !== undefined ? i * itemHeight : offsets![i]!);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, align = "nearest") => {
        const el = scroller.current;
        if (!el || count === 0) return;
        const i = Math.min(count - 1, Math.max(0, index));
        const h = itemHeight ?? offsets![i + 1]! - offsets![i]!;
        el.scrollTop = scrollTopFor(topOf(i), h, el.scrollTop, el.clientHeight, align);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, itemHeight, offsets],
  );

  // Ask for more once per length of the list, when the scroll gets near the end.
  const askedAt = useRef(-1);
  useEffect(() => {
    if (!onEndReached || count === 0) return;
    if (total - scrollTop - viewport < endThreshold && askedAt.current !== count) {
      askedAt.current = count;
      onEndReached();
    }
  }, [onEndReached, count, total, scrollTop, viewport, endThreshold]);

  // A new list (fewer items than before) may leave the scroll past the end.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && el.scrollTop > Math.max(0, total - el.clientHeight)) el.scrollTop = Math.max(0, total - el.clientHeight);
  }, [total]);

  if (count === 0 && empty !== undefined) {
    return (
      <div role="list" aria-label={label} className={cn("min-h-0 overflow-auto", className)}>
        {empty}
      </div>
    );
  }
  const rendered: ReactNode[] = [];
  for (let i = first; i < last; i += 1) {
    const item = items[i] as T;
    const style: CSSProperties | undefined = itemHeight !== undefined ? { height: itemHeight } : undefined;
    rendered.push(
      <div key={keys[i]} role="listitem" aria-setsize={count} aria-posinset={i + 1} data-key={keys[i]} ref={itemHeight === undefined ? watch : undefined} style={style} className="min-w-0">
        {renderItem(item, i)}
      </div>,
    );
  }
  return (
    <div ref={scroller} role="list" aria-label={label} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} className={cn("min-h-0 overflow-auto outline-none", className)}>
      <div style={{ height: total, position: "relative" }}>
        <div style={{ transform: `translateY(${topOf(first)}px)` }}>{rendered}</div>
      </div>
    </div>
  );
}

/** See `VirtualListInner`: a generic, forwarded-ref component. */
export const VirtualList = forwardRef(VirtualListInner) as <T>(props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> }) => ReturnType<typeof VirtualListInner>;
