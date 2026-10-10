import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";
import { hexToRgb, hsvToHex, rgbToHex, rgbToHsv } from "../lib/color";
import type { Hsv } from "../lib/color";

export { hexToRgb, rgbToHex } from "../lib/color";

export interface ColorPickerProps {
  /** The colour as `#rrggbb` (a `#rgb` or a value without `#` is accepted too). */
  value: string;
  /** Called with a lower-case `#rrggbb` as the colour changes: every pointer move of a drag, each arrow key, and a typed hex when it is valid. */
  onValueChange: (hex: string) => void;
  /** Called once when a change is finished: a drag ends, an arrow key is pressed, a typed hex is accepted. */
  onValueCommit?: (hex: string) => void;
  /** Accessible name of the picker, for example "Stop colour". */
  label: string;
  className?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A colour picker: a square for saturation (across) and brightness (up), a hue bar and a hex field, with the colour shown
 * beside the field. It gives and takes `#rrggbb` (`hexToRgb` and `rgbToHex` convert to and from 0 to 255 RGB). Drag or tap the
 * square and the bar, or focus them and use the arrow keys (Shift moves ten times as far); the hex field takes `#rgb` or
 * `#rrggbb` and is applied on Enter or when it loses focus. It is 16rem wide at most and fits a 390px phone, and it works
 * inside a `Popover`.
 */
export function ColorPicker({ value, onValueChange, onValueCommit, label, className }: ColorPickerProps) {
  const rgb = hexToRgb(value) ?? [0, 0, 0];
  const hex = rgbToHex(...rgb);
  // Hue and saturation are kept apart from the hex: a grey has no hue of its own, and dragging through black must not lose it.
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(rgb));
  const latest = useRef(hsv);
  latest.current = hsv;
  useEffect(() => {
    if (hsvToHex(latest.current) !== hex) setHsv(rgbToHsv(rgb));
    // `rgb` follows `hex`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex]);

  // What is being typed in the hex field; null while it just shows the colour. Showing `draft ?? hex` (not a copy kept in sync
  // by an effect) means the field never lags the colour by a render, which would drop a selection made in between.
  const [draft, setDraft] = useState<string | null>(null);
  const typed = draft === null ? null : hexToRgb(draft);

  const apply = (next: Hsv, commit: boolean) => {
    setHsv(next);
    const out = hsvToHex(next);
    onValueChange(out);
    if (commit) onValueCommit?.(out);
  };

  const square = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const dragging = useRef<"square" | "bar" | null>(null);

  const fromSquare = (e: PointerEvent<HTMLDivElement>): Hsv => {
    const r = square.current!.getBoundingClientRect();
    return { h: latest.current.h, s: clamp((e.clientX - r.left) / r.width, 0, 1), v: clamp(1 - (e.clientY - r.top) / r.height, 0, 1) };
  };
  const fromBar = (e: PointerEvent<HTMLDivElement>): Hsv => {
    const r = bar.current!.getBoundingClientRect();
    return { ...latest.current, h: clamp(((e.clientX - r.left) / r.width) * 360, 0, 360) };
  };
  const down = (which: "square" | "bar") => (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = which;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    apply(which === "square" ? fromSquare(e) : fromBar(e), false);
  };
  const move = (which: "square" | "bar") => (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === which) apply(which === "square" ? fromSquare(e) : fromBar(e), false);
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = null;
    onValueCommit?.(hsvToHex(latest.current));
  };

  const squareKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.shiftKey ? 0.1 : 0.01;
    const { h, s, v } = latest.current;
    let next: Hsv | null = null;
    if (e.key === "ArrowRight") next = { h, s: clamp(s + d, 0, 1), v };
    else if (e.key === "ArrowLeft") next = { h, s: clamp(s - d, 0, 1), v };
    else if (e.key === "ArrowUp") next = { h, s, v: clamp(v + d, 0, 1) };
    else if (e.key === "ArrowDown") next = { h, s, v: clamp(v - d, 0, 1) };
    if (!next) return;
    e.preventDefault();
    apply(next, true);
  };
  const barKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.shiftKey ? 10 : 1;
    const { h } = latest.current;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = h + d;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = h - d;
    else if (e.key === "PageUp") next = h + 30;
    else if (e.key === "PageDown") next = h - 30;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 360;
    if (next === null) return;
    e.preventDefault();
    apply({ ...latest.current, h: clamp(next, 0, 360) }, true);
  };

  const commitText = () => {
    if (draft === null) return;
    setDraft(null);
    if (!typed) return;
    const out = rgbToHex(...typed);
    if (out !== hex) {
      setHsv(rgbToHsv(typed));
      onValueChange(out);
    }
    onValueCommit?.(out);
  };

  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <div role="group" aria-label={label} className={cn("flex w-64 max-w-full flex-col gap-3", className)}>
      <div
        ref={square}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Saturation ${pct(hsv.s)}, brightness ${pct(hsv.v)}. Arrow keys move it.`}
        onPointerDown={down("square")}
        onPointerMove={move("square")}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={squareKey}
        style={{ "--hue": `${hsv.h}deg` } as React.CSSProperties}
        className="color-square relative h-40 w-full cursor-crosshair touch-none rounded outline-none focus-visible:outline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span aria-hidden="true" className="color-thumb pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(hsv.s), top: pct(1 - hsv.v) }} />
      </div>
      <div
        ref={bar}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        aria-valuetext={`${Math.round(hsv.h)} degrees`}
        onPointerDown={down("bar")}
        onPointerMove={move("bar")}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={barKey}
        className="color-hue relative h-4 w-full cursor-pointer touch-none rounded outline-none focus-visible:outline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span aria-hidden="true" className="color-thumb pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="size-[var(--control-h)] shrink-0 rounded border border-line" style={{ background: hex }} />
        <input
          aria-label="Hex colour"
          aria-invalid={(draft !== null && !typed) || undefined}
          spellCheck={false}
          autoComplete="off"
          value={draft ?? hex}
          onChange={(e) => {
            setDraft(e.target.value);
            const c = hexToRgb(e.target.value);
            if (c) {
              setHsv(rgbToHsv(c));
              onValueChange(rgbToHex(...c));
            }
          }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText();
            }
          }}
          className="input min-w-0 flex-1 tabular-nums"
        />
      </div>
    </div>
  );
}
