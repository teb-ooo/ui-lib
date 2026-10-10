import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useHighlight } from "./use-highlight";

interface Placed {
  text: ReactNode;
  top: number;
  left?: number;
  right?: number;
  bottom?: number;
}

/**
 * A tip beside the highlighted option of an open list (`Select`, `Combobox`): shown at once, with no hover delay, as the
 * pointer or the arrow keys move the highlight, and gone when it leaves or the list closes. The option's text is also its
 * accessible description while it is highlighted. Give `ref` to the element that holds the items (as for `useHighlight`) and
 * draw `tip` inside the list's portal, so it keeps the forced theme.
 */
export function useOptionTip(tips: ReadonlyMap<string, ReactNode>, onHighlight: ((value: string | null) => void) | undefined) {
  const id = useId();
  const [value, setValue] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const node = useRef<HTMLElement | null>(null);
  const current = useRef<string | null>(null);
  const loop = useRef(0);

  const place = useCallback(() => {
    const el = node.current;
    const v = current.current;
    const text = v === null ? undefined : tips.get(v);
    if (!el || v === null || text === undefined) {
      setPlaced(null);
      return;
    }
    const item = el.querySelector<HTMLElement>(`[data-option-value="${CSS.escape(v)}"]`);
    if (!item) {
      setPlaced(null);
      return;
    }
    const popup = (el.closest(".panel-float") as HTMLElement | null) ?? el;
    const i = item.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    if (p.right + 8 + width <= window.innerWidth - 8) setPlaced({ text, top: i.top, left: p.right + 8 });
    else if (p.left - 8 - width >= 8) setPlaced({ text, top: i.top, right: window.innerWidth - p.left + 8 });
    else if (p.bottom + 8 + 64 <= window.innerHeight) setPlaced({ text, top: p.bottom + 8, left: 8 });
    else setPlaced({ text, top: 0, bottom: window.innerHeight - p.top + 8, left: 8 });
  }, [tips]);

  const ref = useHighlight((v) => {
    current.current = v;
    setValue(v);
    onHighlight?.(v);
    // The list may still be moving into place (its positioner settles over a few frames, and a scroll brings the option into
    // view): measure from the next frame on, for the next 20 frames, never before, so the tip ends where the option is.
    const run = ++loop.current;
    let n = 0;
    const tick = () => {
      if (run !== loop.current) return;
      place();
      if (++n < 20) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const hold = useCallback(
    (el: HTMLElement | null) => {
      node.current = el;
      ref(el);
    },
    [ref],
  );
  useEffect(() => {
    const el = node.current;
    if (!el) return;
    el.addEventListener("scroll", place, true);
    return () => el.removeEventListener("scroll", place, true);
  });

  const text = value === null ? undefined : tips.get(value);
  const tip =
    placed && text !== undefined ? (
      <div
        id={id}
        role="tooltip"
        style={{ top: placed.top, left: placed.left, right: placed.right, bottom: placed.bottom === undefined ? undefined : placed.bottom }}
        className="panel-inverse panel-float pointer-events-none fixed z-[60] max-w-[min(20rem,calc(100vw-1rem))] px-2 py-1 text-ink"
      >
        {placed.text}
      </div>
    ) : null;
  return { ref: hold, tip, describedBy: (v: string) => (v === value && text !== undefined ? id : undefined) };
}
