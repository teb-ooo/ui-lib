import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Measures the height of the elements it is given (each one marked `data-key`) and remembers it by key, so a windowed list
 * knows the real height of what it has drawn and keeps it when the item scrolls out and back. Changes are applied in one
 * batch per frame: `version` changes when any height did, which is the signal to rebuild offsets.
 */
export function useMeasuredHeights(enabled: boolean) {
  const heights = useRef(new Map<string, number>());
  const [version, setVersion] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const pending = useRef(false);
  // A ref callback runs before any effect, so the observer is made when the first element is given.
  const watch = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || !node || typeof ResizeObserver === "undefined") return;
      observer.current ??= new ResizeObserver((entries) => {
        let changed = false;
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const key = el.dataset.key;
          const h = Math.round(el.getBoundingClientRect().height);
          if (key !== undefined && h > 0 && heights.current.get(key) !== h) {
            heights.current.set(key, h);
            changed = true;
          }
        }
        if (changed && !pending.current) {
          pending.current = true;
          requestAnimationFrame(() => {
            pending.current = false;
            setVersion((v) => v + 1);
          });
        }
      });
      observer.current.observe(node);
    },
    [enabled],
  );
  useEffect(
    () => () => {
      observer.current?.disconnect();
      observer.current = null;
    },
    [],
  );
  return { heights: heights.current, version, watch };
}
