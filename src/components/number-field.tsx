import { forwardRef, useRef } from "react";
import type { ReactNode } from "react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Field } from "./field";

export interface NumberFieldProps {
  /** Visible name, tied to the input. */
  label: ReactNode;
  /** The number, or `null` while the box is empty. */
  value: number | null;
  /** Called as the number changes: typing (once it parses), the arrow keys, the steppers. */
  onValueChange: (value: number | null) => void;
  /** Called once when the person finishes: Enter, leaving the box, or letting go of a stepper. The moment to send a change that is expensive to apply. */
  onValueCommit?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** What the arrow keys and the steppers move by. @default 1 */
  step?: number;
  /** Shift and the arrow keys. @default ten steps */
  largeStep?: number;
  /** Alt and the arrow keys. @default a tenth of a step */
  smallStep?: number;
  /** Text after the number inside the box, such as `kHz` or `dB`. */
  unit?: string;
  /** Number formatting (`Intl.NumberFormat` options), for example `{ minimumFractionDigits: 3 }`. */
  format?: Intl.NumberFormatOptions;
  /** Minus and plus buttons at the ends: they are the way to step on a phone. @default true */
  steppers?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  /** Layout classes (the width). */
  className?: string;
}

/**
 * A number typed or stepped: ArrowUp and ArrowDown step (Shift is a large step, Alt a small one), Home and End jump to
 * the limits, typing is parsed in the person's locale, and the minus and plus buttons make it work on a touch screen.
 * Digits are tabular so the figure does not shift as it changes.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, value, onValueChange, onValueCommit, min, max, step = 1, largeStep, smallStep, unit, format, steppers = true, description, error, disabled, readOnly, className },
  ref,
) {
  // Enter commits (the browser does not blur the box): remember it so the blur that follows is not a second commit.
  const enterCommitted = useRef<number | null | undefined>(undefined);
  return (
    <Field label={label} description={description} error={error} className={cn("w-56", className)}>
      <BaseNumberField.Root
        value={value}
        onValueChange={(v) => onValueChange(v)}
        {...(onValueCommit
          ? {
              onValueCommitted: (v: number | null) => {
                if (enterCommitted.current !== undefined && enterCommitted.current === v) {
                  enterCommitted.current = undefined;
                  return;
                }
                enterCommitted.current = undefined;
                onValueCommit(v);
              },
            }
          : {})}
        {...(min !== undefined ? { min } : {})}
        {...(max !== undefined ? { max } : {})}
        step={step}
        largeStep={largeStep ?? step * 10}
        smallStep={smallStep ?? step / 10}
        {...(format ? { format } : {})}
        disabled={disabled}
        readOnly={readOnly}
      >
        <BaseNumberField.Group className="flex items-stretch gap-1">
          {steppers ? (
            <BaseNumberField.Decrement
              render={<Button icon={<Minus aria-hidden="true" className="size-4" />} aria-label="Decrease" disabled={disabled || readOnly} />}
            />
          ) : null}
          <div className="relative min-w-0 flex-1">
            <BaseNumberField.Input
              ref={ref}
              className={cn("input text-right tabular-nums", unit && "pr-10")}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing || !onValueCommit) return;
                const parsed = Number(e.currentTarget.value.replace(/\s/g, "").replace(",", "."));
                const v = e.currentTarget.value.trim() === "" ? null : Number.isFinite(parsed) ? parsed : value;
                enterCommitted.current = v;
                onValueCommit(v);
              }}
            />
            {unit ? (
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-faint">
                {unit}
              </span>
            ) : null}
          </div>
          {steppers ? (
            <BaseNumberField.Increment
              render={<Button icon={<Plus aria-hidden="true" className="size-4" />} aria-label="Increase" disabled={disabled || readOnly} />}
            />
          ) : null}
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    </Field>
  );
});
