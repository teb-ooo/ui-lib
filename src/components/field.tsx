import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import { cn } from "../lib/cn";

export interface FieldProps extends Omit<BaseField.Root.Props, "className" | "invalid" | "children"> {
  /** Label associated with the control. */
  label: ReactNode;
  /** Keep the label for screen readers but do not draw it (a field in a filter bar, where the control says what it is). */
  hideLabel?: boolean;
  /** Error message. When set the field is invalid and the control is described by it. */
  error?: ReactNode;
  /** Keeps one line free under the control for the error, so the fields below do not move when it appears. @default false */
  reserveError?: boolean;
  /** Helper text, also announced with the control. */
  description?: ReactNode;
  /** The control: an `Input` or any Base UI control. */
  children: ReactNode;
  className?: string;
}

/** Label, control, description and error wired for assistive tech: label association, `aria-describedby`, `aria-invalid`, and the error announced as an alert. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hideLabel = false, error, reserveError = false, description, children, className, ...rest },
  ref,
) {
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  return (
    <BaseField.Root ref={ref} invalid={hasError} className={cn("flex flex-col gap-1", className)} {...rest}>
      <BaseField.Label className={hideLabel ? "sr-only" : "text-ink-muted uppercase"}>{label}</BaseField.Label>
      {children}
      {description ? (
        <BaseField.Description className="text-ink-faint">{description}</BaseField.Description>
      ) : null}
      {reserveError ? (
        <div className="min-h-[1.6em]">
          <BaseField.Error match={hasError} className="text-danger" role="alert">
            {error}
          </BaseField.Error>
        </div>
      ) : (
        <BaseField.Error match={hasError} className="text-danger" role="alert">
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
});
