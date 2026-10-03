import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

export interface FrequencyInputProps {
  /** The frequency in kHz. */
  value: number;
  /** Called with every change as it happens: each pointer move of the knob, each arrow key, and when a typed value is set. */
  onValueChange: (value: number) => void;
  /** Called once when a change is finished: a typed value is set, a knob drag ends, an arrow key is pressed. */
  onValueCommit?: (value: number) => void;
  /** Lowest valid frequency in kHz, exclusive of anything below it. @default 0.01 */
  min?: number;
  /** Highest valid frequency in kHz. @default 30000 */
  max?: number;
  /** Accessible name. @default "Frequency" */
  label?: string;
  /** A change is waiting for confirmation: drawn at half opacity. @default false */
  optimistic?: boolean;
  /** Locked: drawn at 35% and not interactive. @default false */
  dimmed?: boolean;
  /** Playing back a recording (rewinding): the readout takes the warning colour. @default false */
  playbackMode?: boolean;
  /** What an arrow key steps by, in kHz (Shift: `fineStep`, PageUp and PageDown: ten steps). @default 1 */
  step?: number;
  /** Shift and an arrow key. @default 0.01 */
  fineStep?: number;
  /** Label of the button under the edit field. @default "Set frequency" */
  submitLabel?: string;
  /** Tooltip of the knob. @default "Hold shift for fine tuning" */
  knobTip?: string;
  className?: string;
}

const DIGITS = 7; // 5 before the point, 2 after: 00000.00
const COARSE_PER_PX = 0.5;
const COARSE_SNAP = 0.05;
const FINE_PER_PX = 0.003;
const FINE_SNAP = 0.01;
const DEG_PER_PX = 2;

/** `740` becomes `00740.00`: kHz with two decimals, zero-padded to eight characters. */
export function formatKhz(value: number): string {
  return value.toFixed(2).padStart(8, "0");
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** The seven digits of a frequency, as a string: 740 -> "0074000". */
const toDigits = (value: number) => Math.round(clamp(value, 0, 99999.99) * 100).toString().padStart(DIGITS, "0");
const fromDigits = (digits: string) => Number(digits) / 100;
/** The mask text for seven digits: "0074000" -> "00740.00". */
const mask = (digits: string) => `${digits.slice(0, 5)}.${digits.slice(5)}`;
/** Caret index in the mask text for digit position `pos` (the point sits after the fifth digit). */
const caretOf = (pos: number) => (pos >= 5 ? pos + 1 : pos);

/**
 * Typing into the mask: the caret sits on one of the seven digits; a digit overwrites the one at the caret and the caret
 * moves on (past the point); Backspace steps back and zeros; Delete zeros in place; the arrows move the caret. The first
 * keystroke after the field opens, with everything selected, starts from zeros at the first digit.
 */
export function typeInto(state: { digits: string; pos: number; fresh: boolean }, key: string): { digits: string; pos: number; fresh: boolean } {
  let { digits, pos } = state;
  if (/^\d$/.test(key)) {
    if (state.fresh) {
      digits = "0".repeat(DIGITS);
      pos = 0;
    }
    if (pos >= DIGITS) pos = DIGITS - 1;
    digits = digits.slice(0, pos) + key + digits.slice(pos + 1);
    return { digits, pos: Math.min(DIGITS, pos + 1), fresh: false };
  }
  if (key === "Backspace") {
    if (state.fresh) return { digits: "0".repeat(DIGITS), pos: 0, fresh: false };
    pos = Math.max(0, pos - 1);
    return { digits: digits.slice(0, pos) + "0" + digits.slice(pos + 1), pos, fresh: false };
  }
  if (key === "Delete") {
    if (state.fresh) return { digits: "0".repeat(DIGITS), pos: 0, fresh: false };
    return { digits: digits.slice(0, pos) + "0" + digits.slice(pos + 1), pos, fresh: false };
  }
  if (key === "ArrowLeft") return { digits, pos: Math.max(0, pos - 1), fresh: false };
  if (key === "ArrowRight") return { digits, pos: Math.min(DIGITS, pos + 1), fresh: false };
  if (key === "Home") return { digits, pos: 0, fresh: false };
  if (key === "End") return { digits, pos: DIGITS, fresh: false };
  return state;
}

/**
 * The hero control of a tuner: the frequency in kHz as a large readout with two decimals, a click-to-type masked editor and a
 * round tuning knob you drag sideways. The readout is a spin button (arrow keys step it, Enter or Space opens the editor);
 * the knob works with a mouse, a finger and the keyboard. A typed value is only used when it is valid (above `min`, at most `max`).
 */
export function FrequencyInput({
  value,
  onValueChange,
  onValueCommit,
  min = 0.01,
  max = 30000,
  label = "Frequency",
  optimistic = false,
  dimmed = false,
  playbackMode = false,
  step = 1,
  fineStep = 0.01,
  submitLabel = "Set frequency",
  knobTip = "Hold shift for fine tuning",
  className,
}: FrequencyInputProps) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ digits: toDigits(value), pos: 0, fresh: true });
  const [angle, setAngle] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);
  const field = useRef<HTMLInputElement | null>(null);
  const drag = useRef<{ x: number; value: number; fine: boolean; angle: number } | null>(null);
  const latest = useRef(value);
  latest.current = value;

  const typed = fromDigits(edit.digits);
  const valid = typed >= min && typed <= max;

  const open = () => {
    if (dimmed) return;
    setEdit({ digits: toDigits(value), pos: 0, fresh: true });
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const submit = () => {
    if (!valid) return;
    setEditing(false);
    onValueChange(typed);
    onValueCommit?.(typed);
  };

  // Focus the field and show the selection when it opens; put the caret where the mask says after each keystroke.
  useEffect(() => {
    if (!editing) return;
    const input = field.current;
    if (!input) return;
    input.focus();
    if (edit.fresh) input.setSelectionRange(0, input.value.length);
    else {
      const c = caretOf(edit.pos);
      input.setSelectionRange(c, Math.min(input.value.length, c + 1));
    }
  }, [editing, edit]);

  // A press anywhere outside cancels without setting.
  useEffect(() => {
    if (!editing) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [editing]);

  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
      return;
    }
    if (e.key === "Tab" || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    setEdit((s) => typeInto(s, e.key));
  };

  const stepBy = (delta: number) => {
    const next = round2(clamp(latest.current + delta, min, max));
    if (next === latest.current) return;
    onValueChange(next);
    onValueCommit?.(next);
  };
  const onNumberKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (dimmed) return;
    const s = e.shiftKey ? fineStep : step;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") stepBy(s);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") stepBy(-s);
    else if (e.key === "PageUp") stepBy(step * 10);
    else if (e.key === "PageDown") stepBy(-step * 10);
    else if (e.key === "Home") stepBy(min - latest.current);
    else if (e.key === "End") stepBy(max - latest.current);
    else if (e.key === "Enter" || e.key === " ") open();
    else return;
    e.preventDefault();
  };

  const onKnobDown = (e: PointerEvent<HTMLDivElement>) => {
    if (dimmed) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, value: latest.current, fine: e.shiftKey, angle };
  };
  const onKnobMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (e.shiftKey !== d.fine) {
      // Shift pressed or released mid-drag: carry on from here at the other rate, with no jump.
      drag.current = { x: e.clientX, value: latest.current, fine: e.shiftKey, angle: d.angle + (e.clientX - d.x) * DEG_PER_PX };
      return;
    }
    const dx = e.clientX - d.x;
    const per = d.fine ? FINE_PER_PX : COARSE_PER_PX;
    const snap = d.fine ? FINE_SNAP : COARSE_SNAP;
    const next = round2(clamp(Math.round((d.value + dx * per) / snap) * snap, min, max));
    setAngle(d.angle + dx * DEG_PER_PX);
    if (next !== latest.current) onValueChange(next);
  };
  const onKnobUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onValueCommit?.(latest.current);
  };

  const tone = playbackMode ? "text-warning" : "text-ink";
  return (
    <div ref={root} aria-disabled={dimmed || undefined} className={cn("inline-flex flex-col gap-2", dimmed && "pointer-events-none opacity-35", className)}>
      <div className={cn("flex items-center gap-3", optimistic && "opacity-50")}>
        {editing ? (
          <input
            ref={field}
            aria-label={`${label} in kHz`}
            inputMode="numeric"
            autoComplete="off"
            value={mask(edit.digits)}
            onChange={() => undefined}
            onKeyDown={onFieldKey}
            onFocus={(e) => {
              if (edit.fresh) e.currentTarget.setSelectionRange(0, e.currentTarget.value.length);
            }}
            aria-invalid={!valid || undefined}
            className="input display-lg h-auto w-[9ch] px-2 text-center tabular-nums"
          />
        ) : (
          <div
            role="spinbutton"
            tabIndex={dimmed ? -1 : 0}
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={`${formatKhz(value)} kilohertz`}
            onClick={open}
            onKeyDown={onNumberKey}
            className={cn(
              "display-lg cursor-text rounded px-2 tabular-nums outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ink-muted",
              tone,
            )}
          >
            {formatKhz(value)}
          </div>
        )}
        <span aria-hidden="true" className={cn("text-ink-faint", editing && "invisible")}>
          kHz
        </span>
        <Tooltip tip={knobTip} side="bottom">
          <div
            role="slider"
            tabIndex={dimmed ? -1 : 0}
            aria-label={`Tune ${label.toLowerCase()}`}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={`${formatKhz(value)} kilohertz`}
            onPointerDown={onKnobDown}
            onPointerMove={onKnobMove}
            onPointerUp={onKnobUp}
            onPointerCancel={onKnobUp}
            onKeyDown={onNumberKey}
            className="group relative size-8 shrink-0 cursor-ew-resize touch-none outline-none"
          >
            {/* The knob is a drawing, not a box: a circle is drawn in SVG like the graph's nodes, so the one corner radius stays one. */}
            <svg aria-hidden="true" viewBox="0 0 32 32" className="absolute inset-0 size-full">
              <circle cx="16" cy="16" r="15" strokeWidth="1" className="fill-surface-raised stroke-ink-muted group-hover:stroke-ink group-focus-visible:stroke-ink group-focus-visible:[stroke-width:2.5]" />
              <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "16px 16px" }}>
                <circle cx="16" cy="6" r="2" className="fill-ink" />
              </g>
            </svg>
          </div>
        </Tooltip>
      </div>
      {editing ? (
        <div className="flex flex-col gap-1">
          <Button intent="solid" disabled={!valid} onClick={submit}>
            {submitLabel}
          </Button>
          {!valid ? (
            <span role="status" className="text-ink-faint">
              {`${min} to ${max} kHz`}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
