import { useId } from "react";
import type { ReactNode } from "react";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "../lib/cn";

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
  className?: string;
}

export interface SliderProps extends Common {
  value: number;
  onValueChange: (value: number) => void;
  /** Called once when the person lets go or finishes a key press: the moment to send a change that is expensive to apply. */
  onValueCommit?: (value: number) => void;
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
  "relative block size-4 rounded border border-ink-muted bg-surface-raised outline-none",
  "before:absolute before:-inset-2 before:content-['']",
  // Hovered, dragged or focused, the thumb reverses (white on a dark page, black on a light one): no outline needed.
  "hover:border-ink hover:bg-ink data-[dragging]:border-ink data-[dragging]:bg-ink focus-within:border-ink focus-within:bg-ink",
  "data-[disabled]:cursor-not-allowed data-[disabled]:border-line-strong data-[disabled]:bg-surface-raised data-[disabled]:opacity-50",
);

function Header({ label, readout, hideValue, labelId }: { label: string; readout: string; hideValue: boolean | undefined; labelId: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span id={labelId} className="text-ink-muted uppercase">
        {label}
      </span>
      {hideValue ? null : (
        <output aria-hidden="true" className="tabular-nums text-ink">
          {readout}
        </output>
      )}
    </div>
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
export function Slider({ value, onValueChange, onValueCommit, label, min = 0, max = 100, step = 1, largeStep, unit, format, description, hideValue, disabled, className }: SliderProps) {
  const text = body({ unit, format });
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Header label={label} readout={text(value)} hideValue={hideValue} labelId={labelId} />
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
        <BaseSlider.Control className="flex h-7 w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed">
          <BaseSlider.Track className={track}>
            <BaseSlider.Indicator className={indicator} />
            <BaseSlider.Thumb className={thumb} getAriaLabel={() => label} getAriaValueText={(_f, v) => text(v)} />
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

/** Two thumbs on one scale: a low and a high value, such as a passband or a floor and ceiling. They cannot cross, and keep `minGap` apart. */
export function RangeSlider({ value, onValueChange, onValueCommit, label, min = 0, max = 100, step = 1, largeStep, minGap = 0, unit, format, description, hideValue, disabled, className }: RangeSliderProps) {
  const text = body({ unit, format });
  const labelId = useId();
  const descriptionId = useId();
  const names = [`${label} minimum`, `${label} maximum`] as const;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Header label={label} readout={`${text(value[0])} to ${text(value[1])}`} hideValue={hideValue} labelId={labelId} />
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
        <BaseSlider.Control className="flex h-7 w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed">
          <BaseSlider.Track className={track}>
            <BaseSlider.Indicator className={indicator} />
            {[0, 1].map((i) => (
              <BaseSlider.Thumb key={i} index={i} className={thumb} getAriaLabel={() => names[i] ?? label} getAriaValueText={(_f, v) => text(v)} />
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
