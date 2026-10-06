import type { KeyboardEvent } from "react";

const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

/**
 * Arrow-key focus movement for a grid of focusable items (`CardGrid`, `MediaGrid`): left and right along the row, up and
 * down to the nearest item in the next row, Home and End to the ends. `items` are the focusable elements in order; the
 * handler does nothing when focus is not on one of them.
 */
export function moveFocusInGrid(e: KeyboardEvent, items: HTMLElement[]): void {
  if (!KEYS.includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
  const here = items.findIndex((c) => c === document.activeElement);
  if (here < 0) return;
  let target = here;
  if (e.key === "ArrowRight") target = here + 1;
  else if (e.key === "ArrowLeft") target = here - 1;
  else if (e.key === "Home") target = 0;
  else if (e.key === "End") target = items.length - 1;
  else {
    const rect = items[here]!.getBoundingClientRect();
    const down = e.key === "ArrowDown";
    let best = -1;
    let bestScore = Infinity;
    items.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (down ? r.top <= rect.top + 1 : r.top >= rect.top - 1) return;
      const score = Math.abs(r.top - rect.top) * 1000 + Math.abs(r.left - rect.left);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) return;
    target = best;
  }
  const next = items[Math.min(items.length - 1, Math.max(0, target))];
  if (!next || next === items[here]) return;
  e.preventDefault();
  next.focus();
}
