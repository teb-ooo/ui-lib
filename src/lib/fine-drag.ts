import { useRef, useState } from "react";
import type { PointerEvent } from "react";

/** Distance from the track centre, in px, at which each slower speed begins: full speed on the track, then half, a quarter and a tenth. */
export const FINE_STEPS = [
  { from: 0, factor: 1 },
  { from: 48, factor: 0.5 },
  { from: 96, factor: 0.25 },
  { from: 144, factor: 0.1 },
] as const;

/** The speed for a finger `distance` px above or below the track. */
export function fineFactor(distance: number): number {
  let factor: number = FINE_STEPS[0].factor;
  for (const s of FINE_STEPS) if (Math.abs(distance) >= s.from) factor = s.factor;
  return factor;
}

/** A speed as text: "Full speed", "Fine 1/2", "Fine 1/4", "Fine 1/10". */
export function fineName(factor: number): string {
  return factor >= 1 ? "Full speed" : factor >= 0.5 ? "Fine 1/2" : factor >= 0.25 ? "Fine 1/4" : "Fine 1/10";
}

interface Options {
  enabled: boolean;
  min: number;
  max: number;
  step: number;
  /** The values now, one per thumb. */
  values: () => number[];
  /** A thumb moved: all the values after the move. */
  onChange: (values: number[], thumb: number) => void;
  /** The finger lifted: the final values. */
  onCommit?: (values: number[]) => void;
  /** Least distance between neighbouring thumbs. */
  gap?: number;
}

/**
 * Slide-away fine tuning for a touch or pen drag on a slider thumb, like the iOS scrubber: the further the finger is from the
 * track (up or down), the slower the thumb follows its sideways travel, so a value can be set exactly. Put `onPointerDownCapture`
 * and `ref` on the slider's control and mark each thumb `data-fine-thumb={index}`; a mouse, the keyboard and a tap on the track
 * are left to the slider itself. `factor` is the current speed while a drag is on, else null.
 */
export function useFineDrag({ enabled, min, max, step, values, onChange, onCommit, gap = 0 }: Options) {
  const control = useRef<HTMLDivElement | null>(null);
  const [factor, setFactor] = useState<number | null>(null);

  const onPointerDownCapture = (e: PointerEvent<HTMLElement>) => {
    if (!enabled || e.pointerType === "mouse" || e.button !== 0) return;
    const thumbEl = (e.target as HTMLElement).closest<HTMLElement>("[data-fine-thumb]");
    const area = control.current;
    if (!thumbEl || !area) return;
    const thumb = Number(thumbEl.getAttribute("data-fine-thumb"));
    // This drag is ours: the slider's own drag does not start.
    e.stopPropagation();
    e.preventDefault();
    thumbEl.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    thumbEl.setPointerCapture?.(e.pointerId);

    const rect = area.getBoundingClientRect();
    const trackY = rect.top + rect.height / 2;
    const span = max - min;
    let x = e.clientX;
    const current = values();
    let exact = current[thumb] ?? min;
    let latest = current;
    setFactor(1);

    const snap = (v: number) => Math.round((v - min) / step) * step + min;
    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const f = fineFactor(ev.clientY - trackY);
      exact += ((ev.clientX - x) / rect.width) * span * f;
      x = ev.clientX;
      const base = latest.slice();
      const low = thumb > 0 ? (base[thumb - 1] ?? min) + gap : min;
      const high = thumb < base.length - 1 ? (base[thumb + 1] ?? max) - gap : max;
      exact = Math.min(Math.max(exact, low), high);
      const next = Math.min(Math.max(snap(exact), low), high);
      setFactor(f);
      if (next !== base[thumb]) {
        base[thumb] = next;
        latest = base;
        onChange(base, thumb);
      }
    };
    const end = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      thumbEl.removeEventListener("pointermove", move);
      thumbEl.removeEventListener("pointerup", end);
      thumbEl.removeEventListener("pointercancel", end);
      setFactor(null);
      onCommit?.(latest);
    };
    thumbEl.addEventListener("pointermove", move);
    thumbEl.addEventListener("pointerup", end);
    thumbEl.addEventListener("pointercancel", end);
  };

  return { ref: control, onPointerDownCapture, factor };
}
