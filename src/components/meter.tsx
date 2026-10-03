import { Meter as BaseMeter } from "@base-ui/react/meter";
import { cn } from "../lib/cn";

export type MeterTone = "ok" | "warning" | "danger";

export interface MeterZone {
  /** The zone starts at this value (inclusive) and runs to the next zone or the end. */
  from: number;
  tone: MeterTone;
}

export interface MeterProps {
  /** What it measures; the accessible name. */
  label: string;
  value: number;
  min?: number;
  max?: number;
  /**
   * Colour by value: the bar takes the tone of the last zone whose `from` is at or below the value, for example
   * `[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]`. Colour is state: without
   * zones the bar is neutral.
   */
  zones?: readonly MeterZone[];
  /** Turns the value into the text shown and spoken (`aria-valuetext`). @default the number */
  format?: (value: number) => string;
  /** Show the label and value above the bar. @default true */
  showValue?: boolean;
  /** `vertical` fills from the bottom: give it a height with `className`. @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const fills: Record<MeterTone | "neutral", string> = {
  neutral: "bg-ink-muted",
  ok: "bg-ok",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * A read-only measurement against a scale: a level, a signal strength, a quota. Not a progress bar (use that for a task
 * that finishes) and not an input (use `Slider`). It is exposed as `role="meter"` with its value, minimum and maximum.
 */
export function Meter({ label, value, min = 0, max = 100, zones, format, showValue = true, orientation = "horizontal", className }: MeterProps) {
  const clamped = Math.min(max, Math.max(min, value));
  const tone = zones?.filter((z) => z.from <= clamped).sort((a, b) => b.from - a.from)[0]?.tone;
  const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const text = format ? format(clamped) : String(clamped);
  const vertical = orientation === "vertical";
  return (
    <BaseMeter.Root
      value={clamped}
      min={min}
      max={max}
      getAriaValueText={() => text}
      aria-label={label}
      className={cn(vertical ? "flex h-full flex-col items-center gap-1" : "flex flex-col gap-1", className)}
    >
      {showValue ? (
        <div className={cn("flex items-baseline gap-3", vertical ? "flex-col" : "justify-between")}>
          <span className="text-ink-muted uppercase">{label}</span>
          <span aria-hidden="true" className="tabular-nums text-ink">
            {text}
          </span>
        </div>
      ) : null}
      <BaseMeter.Track className={cn("relative overflow-hidden rounded bg-line-strong", vertical ? "w-2 flex-1" : "h-2 w-full")}>
        <BaseMeter.Indicator
          className={cn("absolute rounded transition-[width,height]", fills[tone ?? "neutral"], vertical ? "bottom-0 w-full" : "left-0 h-full")}
          style={vertical ? { height: `${percent}%`, width: "100%" } : { width: `${percent}%` }}
        />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
