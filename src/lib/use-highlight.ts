import { useCallback, useEffect, useRef } from "react";

/**
 * Reports which option of an open list is highlighted (pointed at, or reached with the keys). Base UI marks the highlighted
 * item with `data-highlighted`; the items carry `data-option-value`. Give the returned ref to the element that holds the
 * items: it is called with the value when the highlight moves, and with `null` when no item is highlighted or the element
 * goes away (the list closed). Calls are made only when the value changes.
 */
export function useHighlight(onHighlight: ((value: string | null) => void) | undefined) {
  const callback = useRef(onHighlight);
  callback.current = onHighlight;
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node || !callback.current) return;
    let last: string | null | undefined;
    const report = () => {
      const el = node.querySelector<HTMLElement>("[data-highlighted][data-option-value]");
      const value = el?.dataset.optionValue ?? null;
      if (value !== last) {
        last = value;
        callback.current?.(value);
      }
    };
    const observer = new MutationObserver(report);
    observer.observe(node, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-highlighted"] });
    report();
    cleanup.current = () => {
      observer.disconnect();
      if (last !== null && last !== undefined) callback.current?.(null);
    };
  }, []);
}
