import type { MouseEvent, ReactNode, Ref, RefObject } from "react";

/**
 * Muted text or an icon inside a control's border, before or after what the person types or picks ("LO", "HI", "$", a
 * magnifier). It is decoration: hidden from assistive technology (the control's own label names it), it takes no pointer
 * input of its own, and a click on it reaches the control.
 */
export function Adornment({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="pointer-events-none flex shrink-0 select-none items-center text-ink-faint">
      {children}
    </span>
  );
}

/** What the controls that take adornments share. */
export interface AdornmentProps {
  /** Muted text or an icon at the start of the box, inside the border: "LO", "$". The control's label still names it (use `Field hideLabel` to keep the label for screen readers only). */
  startAdornment?: ReactNode;
  /** The same at the end of the box: "kHz", "%". */
  endAdornment?: ReactNode;
}

/** Sets a forwarded ref and a local one from the same element. */
export function setBothRefs<T>(local: RefObject<T | null>, forwarded: Ref<T> | undefined, node: T | null): void {
  local.current = node;
  if (typeof forwarded === "function") forwarded(node);
  else if (forwarded) (forwarded as RefObject<T | null>).current = node;
}

/** A mouse press on a box's decoration (an adornment, the padding) goes to the input inside it, as a click on a label would. */
export function focusInside(input: RefObject<HTMLElement | null>) {
  return (e: MouseEvent) => {
    if (e.target !== input.current) {
      e.preventDefault();
      input.current?.focus();
    }
  };
}
