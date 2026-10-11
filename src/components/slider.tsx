import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { Minus, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { fineName, useFineDrag } from "../lib/fine-drag";

interface Common {
  /** Visible name; also the accessible name of the thumb (a range names its thumbs "<label> minimum" and "<label> maximum"). */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** What PageUp and PageDown move by, in the value's unit. @default ten steps */
  largeStep?: number;
  /** Text after the number in the readout and in the spoken value, for example `Hz` or `dB`. */
  unit?: string;
  /** Turns a value into the text shown and spoken. @default the number as is */
  format?: (value: number) => string;
  /** Helper text under the slider, announced with it. */
  description?: ReactNode;
  /** Hide the value next to the label (when the app draws its own readout). @default false */
  hideValue?: boolean;
  disabled?: boolean;
  /**
   * Slide-away fine tuning for a finger or a pen (not a mouse): while a thumb is dragged, moving the finger up or down away from
   * the track slows it, in steps (half, a quarter, a tenth of the sideways travel: 48, 96 and 144px from the track's centre), like
   * the iOS scrubber, so a value can be set exactly; "Fine 1/4" and the like shows in the label row while it is in use. @default true
   */
  fineDrag?: boolean;
  className?: string;
}

export interface SliderProps extends Common {
  value: number;
  onValueChange: (value: number) => void;
  /** Called once when the person lets go or finishes a key press: the moment to send a change that is expensive to apply. */
  onValueCommit?: (value: number) => void;
  /** A minus and a plus button at the ends of the track that move the value by one `step` (hold to repeat). A `Slider` only. @default false */
  nudge?: boolean;
}

export interface RangeSliderProps extends Common {
  /** `[low, high]`. */
  value: readonly [number, number];
  onValueChange: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  /** Least distance between the two thumbs, in the same unit as the value. @default 0 */
  minGap?: number;
}

const track = "relative h-1 w-full rounded bg-line-strong";
const indicator = "absolute h-full rounded bg-ink-muted data-[disabled]:bg-ink-faint";
// The visible thumb is 16px; its ::before makes the touch target 28px (the control height).
const thumb = cn(
  "reverses relative block size-4 rounded border border-ink-muted bg-surface-raised outline-none",
  "before:absolute before:-inset-2 before:content-['']",
  "data-[disabled]:cursor-not-allowed data-[disabled]:border-line-strong data-[disabled]:opacity-50",
);

function Header({ label, readout, hideValue, labelId, speed }: { label: string; readout: string; hideValue: boolean | undefined; labelId: string; speed?: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span id={labelId} className="text-ink-muted uppercase">
        {label}
      </span>
      {hideValue ? null : (
        <output aria-hidden="true" className="tabular-nums text-ink">
          {speed !== null && speed !== undefined && speed < 1 ? <span className="mr-2 text-ink-faint">{fineName(speed)}</span> : null}
          {readout}
        </output>
      )}
    </div>
  );
}

/** A minus or plus button that steps once on press and keeps stepping while it is held. */
function NudgeButton({ dir, label, disabled, nudge, commit }: { dir: 1 | -1; label: string; disabled: boolean | undefined; nudge: (dir: 1 | -1) => void; commit: () => void }) {
  const timer = useRef<number | undefined>(undefined);
  const stop = () => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    window.clearInterval(timer.current);
    timer.current = undefined;
    commit();
  };
  const start = () => {
    nudge(dir);
    timer.current = window.setTimeout(() => {
      timer.current = window.setInterval(() => nudge(dir), 70);
    }, 400);
  };
  return (
    <Button
      icon={dir < 0 ? <Minus aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button === 0) start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          nudge(dir);
          commit();
        }
      }}
      className="shrink-0 border-transparent"
    />
  );
}

function body({ unit, format }: Pick<Common, "unit" | "format">) {
  const text = (v: number) => `${format ? format(v) : String(v)}${unit ? ` ${unit}` : ""}`;
  return text;
}

/**
 * Chooses one number on a scale by dragging a thumb or with the keyboard (arrows, Home, End, PageUp, PageDown).
 * The thumb has a 28px touch target. The value is shown next to the label and spoken with its unit.
 */
export function Slider({ value, onValueChange, onValueCommit, label, min = 0, max = 100, step = 1, largeStep, unit, format, description, hideValue, disabled, fineDrag = true, nudge = false, className }: SliderProps) {
  const text = body({ unit, format });
  const fine = useFineDrag({
    enabled: fineDrag && !disabled,
    min,
    max,
    step,
    values: () => [value],
    onChange: (v) => onValueChange(v[0] ?? value),
    ...(onValueCommit ? { onCommit: (v: number[]) => onValueCommit(v[0] ?? value) } : {}),
  });
  // The nudge buttons read the value as it is now, also while they repeat.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  const nudgeBy = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, latest.current + dir * step));
    if (next !== latest.current) {
      latest.current = next;
      onValueChange(next);
    }
  };
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Header label={label} readout={text(value)} hideValue={hideValue} labelId={labelId} speed={fine.factor} />
      <BaseSlider.Root
        value={value}
        min={min}
        max={max}
        step={step}
        largeStep={largeStep ?? step * 10}
        disabled={disabled}
        onValueChange={(v) => onValueChange(v)}
        {...(onValueCommit ? { onValueCommitted: (v: number) => onValueCommit(v) } : {})}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="flex items-center gap-2">
          {nudge ? <NudgeButton dir={-1} label={`Decrease ${label}`} disabled={disabled} nudge={nudgeBy} commit={() => onValueCommit?.(latest.current)} /> : null}
          <div className="min-w-0 flex-1">
            <BaseSlider.Control ref={fine.ref} onPointerDownCapture={fine.onPointerDownCapture} className="flex h-7 w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed">
              <BaseSlider.Track className={track}>
                <BaseSlider.Indicator className={indicator} />
                <BaseSlider.Thumb data-fine-thumb={0} className={thumb} getAriaLabel={() => label} getAriaValueText={(_f, v) => text(v)} />
              </BaseSlider.Track>
            </BaseSlider.Control>
          </div>
          {nudge ? <NudgeButton dir={1} label={`Increase ${label}`} disabled={disabled} nudge={nudgeBy} commit={() => onValueCommit?.(latest.current)} /> : null}
        </div>
      </BaseSlider.Root>
      {description ? (
        <span id={descriptionId} className="text-ink-faint">
          {description}
        </span>
      ) : null}
    </div>
  );
}

/** Two thumbs on one scale: a low and a high value, such as a passband or a floor and ceiling. They cannot cross, and keep `minGap` apart. */
export function RangeSlider({ value, onValueChange, onValueCommit, label, min = 0, max = 100, step = 1, largeStep, minGap = 0, unit, format, description, hideValue, disabled, fineDrag = true, className }: RangeSliderProps) {
  const text = body({ unit, format });
  const fine = useFineDrag({
    enabled: fineDrag && !disabled,
    min,
    max,
    step,
    gap: minGap,
    values: () => [value[0], value[1]],
    onChange: (v) => onValueChange([v[0] ?? value[0], v[1] ?? value[1]]),
    ...(onValueCommit ? { onCommit: (v: number[]) => onValueCommit([v[0] ?? value[0], v[1] ?? value[1]]) } : {}),
  });
  const labelId = useId();
  const descriptionId = useId();
  const names = [`${label} minimum`, `${label} maximum`] as const;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Header label={label} readout={`${text(value[0])} to ${text(value[1])}`} hideValue={hideValue} labelId={labelId} speed={fine.factor} />
      <BaseSlider.Root
        value={[value[0], value[1]]}
        min={min}
        max={max}
        step={step}
        largeStep={largeStep ?? step * 10}
        minStepsBetweenValues={Math.max(0, Math.ceil(minGap / step))}
        thumbCollisionBehavior="none"
        disabled={disabled}
        onValueChange={(v) => onValueChange([v[0] ?? value[0], v[1] ?? value[1]])}
        {...(onValueCommit ? { onValueCommitted: (v: readonly number[]) => onValueCommit([v[0] ?? value[0], v[1] ?? value[1]]) } : {})}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <BaseSlider.Control ref={fine.ref} onPointerDownCapture={fine.onPointerDownCapture} className="flex h-7 w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed">
          <BaseSlider.Track className={track}>
            <BaseSlider.Indicator className={indicator} />
            {[0, 1].map((i) => (
              <BaseSlider.Thumb key={i} index={i} data-fine-thumb={i} className={thumb} getAriaLabel={() => names[i] ?? label} getAriaValueText={(_f, v) => text(v)} />
            ))}
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
      {description ? (
        <span id={descriptionId} className="text-ink-faint">
          {description}
        </span>
      ) : null}
    </div>
  );
}
