/**
 * Windowing: which items of a long list are on screen. The pure functions here are shared by `VirtualList` (fixed or
 * measured heights) and `DataTable` (fixed row height), so both agree on what "visible plus overscan" means.
 */

export interface WindowRange {
  /** Index of the first item to render. */
  first: number;
  /** One past the index of the last item to render. */
  last: number;
}

/** The items to render for a scroll position when every item is `itemHeight` tall. */
export function fixedRange(count: number, itemHeight: number, scrollTop: number, viewport: number, overscan: number): WindowRange {
  if (count <= 0 || itemHeight <= 0) return { first: 0, last: 0 };
  // A scroll position past the end (a list that just got shorter) is treated as the end.
  const top = Math.min(scrollTop, Math.max(0, count * itemHeight - viewport));
  const first = Math.max(0, Math.floor(top / itemHeight) - overscan);
  const last = Math.min(count, Math.ceil((top + viewport) / itemHeight) + overscan);
  return { first, last };
}

/**
 * `offsets[i]` is the top of item `i` and `offsets[count]` the total height (so `offsets.length` is `count + 1`).
 * Builds it from the item heights, a measured one where there is one and `estimate` elsewhere.
 */
export function buildOffsets(count: number, heightOf: (index: number) => number | undefined, estimate: number): Float64Array {
  const offsets = new Float64Array(count + 1);
  for (let i = 0; i < count; i += 1) offsets[i + 1] = offsets[i]! + (heightOf(i) ?? estimate);
  return offsets;
}

/** The index of the item that holds `y` (the last item whose top is at or above it), found by binary search. */
export function indexAt(offsets: Float64Array, y: number): number {
  const count = offsets.length - 1;
  if (count <= 0) return 0;
  let lo = 0;
  let hi = count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid]! <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The items to render for a scroll position over measured offsets. */
export function measuredRange(offsets: Float64Array, scrollTop: number, viewport: number, overscan: number): WindowRange {
  const count = offsets.length - 1;
  if (count <= 0) return { first: 0, last: 0 };
  const first = Math.max(0, indexAt(offsets, scrollTop) - overscan);
  const last = Math.min(count, indexAt(offsets, scrollTop + viewport) + 1 + overscan);
  return { first, last };
}

/**
 * The scrollTop that brings an item into view with the least movement (`nearest`), or puts it at the `start` or the
 * `center`. `inset` is space at the top the scroller covers (a sticky header).
 */
export function scrollTopFor(
  top: number,
  height: number,
  scrollTop: number,
  viewport: number,
  align: "nearest" | "start" | "center",
  inset = 0,
): number {
  if (align === "start") return Math.max(0, top - inset);
  if (align === "center") return Math.max(0, top - (viewport - height) / 2);
  if (top - inset < scrollTop) return Math.max(0, top - inset);
  if (top + height > scrollTop + viewport) return top + height - viewport;
  return scrollTop;
}
