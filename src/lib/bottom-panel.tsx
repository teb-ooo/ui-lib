import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "./cn";

/** Where a finger is the pointer and the screen is small: a phone, in portrait or turned sideways. */
const PHONE = "(max-width: 40rem), (pointer: coarse) and (max-height: 30rem)";

/** A test environment (jsdom) may have no `matchMedia`: nothing is a phone there. */
const canMatch = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribe(listener: () => void): () => void {
  if (!canMatch()) return () => undefined;
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/**
 * Whether popups are drawn as bottom panels. Every popup that would be drawn over the page next to its trigger (select,
 * combobox, menu, popover, dialog) is a reversed panel that slides up from the bottom edge here, and keeps its anchored
 * or centred look elsewhere.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => canMatch() && window.matchMedia(PHONE).matches,
    () => false,
  );
}

/**
 * The positioner overrides that pin a Base UI popup to the bottom edge. Base UI writes the anchored position into the
 * positioner's inline style; a style passed to the positioner is applied after it and wins.
 */
const PANEL_POSITIONER: CSSProperties = {
  position: "fixed",
  top: "auto",
  right: 0,
  left: 0,
  width: "100%",
  transform: "none",
};

/** How far the on-screen keyboard (or a pinch zoom) covers the bottom of the layout viewport, in px. */
function coveredBottom(): number {
  const v = window.visualViewport;
  return v ? Math.max(0, Math.round(window.innerHeight - v.height - v.offsetTop)) : 0;
}

function subscribeViewport(listener: () => void): () => void {
  const v = window.visualViewport;
  v?.addEventListener("resize", listener);
  v?.addEventListener("scroll", listener);
  return () => {
    v?.removeEventListener("resize", listener);
    v?.removeEventListener("scroll", listener);
  };
}

/** The positioner style of a panel (undefined where popups stay anchored): pinned to the bottom edge, above the keyboard. */
export function usePanelStyle(): CSSProperties | undefined {
  const phone = usePhone();
  const covered = useSyncExternalStore(subscribeViewport, coveredBottom, () => 0);
  return phone ? { ...PANEL_POSITIONER, bottom: covered } : undefined;
}

/** The panel itself: reversed, full width, rounded at the top only, scrolling inside, clear of the home indicator. */
export const PANEL_POPUP =
  "anim-panel panel-inverse panel-float w-full max-h-[85dvh] overflow-y-auto overscroll-contain rounded-b-none border-b-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-ink outline-none";

/** The classes of the dimmed page behind a panel; draw it with the popup's own `Backdrop` part, which is there only while it is open. */
export const PANEL_BACKDROP = "anim-backdrop fixed inset-0 z-50 bg-black/50";

const DISMISS_PX = 96;

/**
 * Drag a panel down by its handle to close it: returns the style to put on the panel while it is dragged and the handlers for
 * the handle. A drag past 96px calls `close`; a shorter one lets go and the panel returns.
 */
export function usePanelDrag(close: () => void) {
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    start.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
  };
  const onPointerUp = () => {
    const far = drag > DISMISS_PX;
    start.current = null;
    setDrag(0);
    if (far) close();
  };
  return {
    style: drag > 0 ? ({ transform: `translateY(${drag}px)`, transition: "none" } as CSSProperties) : undefined,
    handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}

/** The grab handle drawn at the top of a panel; give it `usePanelDrag(...).handle` to make it draggable. */
export function PanelHandle(props: Partial<ReturnType<typeof usePanelDrag>["handle"]> = {}) {
  return (
    <div aria-hidden="true" {...props} className="flex h-5 shrink-0 cursor-grab touch-none items-center justify-center">
      <span className="h-1 w-10 rounded bg-line-strong" />
    </div>
  );
}

const open = new Map<string, true>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/**
 * Panels stack like toasts: the newest is in front, each older one sits behind it, a little smaller and higher.
 * Returns how many panels are open above this one (0 for the front panel), and registers this one while `isOpen`.
 */
export function usePanelsAbove(isOpen: boolean): number {
  const id = useId();
  const [order, setOrder] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    open.set(id, true);
    emit();
    const update = () => {
      const ids = [...open.keys()];
      setOrder(ids.length - 1 - ids.indexOf(id));
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
      open.delete(id);
      emit();
    };
  }, [isOpen, id]);
  return isOpen ? order : 0;
}

/** The style that sets a panel back when `above` panels are in front of it. */
export function panelDepthStyle(above: number): CSSProperties | undefined {
  if (above === 0) return undefined;
  return { transform: `translateY(-${above * 0.5}rem) scale(${1 - above * 0.04})`, transformOrigin: "50% 100%", transition: "transform 180ms var(--ease-out)" };
}

/** A panel's children with the handle above them. */
export function PanelBody({ children }: { children: ReactNode }) {
  return (
    <>
      <PanelHandle />
      {children}
    </>
  );
}

/**
 * Everything a Base UI popup needs to be a bottom panel on a phone, in one call: `style` for the positioner, `backdrop` and
 * `handle` to render, and `popupClass(desktop)` for the popup (the panel classes on a phone, `desktop` elsewhere).
 */
export function usePanel() {
  const phone = usePhone();
  const style = usePanelStyle();
  return {
    phone,
    style,
    /** `<panel.Backdrop />` inside the portal: the popup's Backdrop part on a phone, nothing elsewhere. */
    backdropClass: phone ? PANEL_BACKDROP : null,
    handle: phone ? <PanelHandle /> : null,
    popupClass: (desktop: string, phoneExtra = "px-1") => (phone ? cn(PANEL_POPUP, phoneExtra) : desktop),
  };
}
