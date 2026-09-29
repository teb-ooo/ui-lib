import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import { cn } from "../lib/cn";

export interface FieldProps extends Omit<BaseField.Root.Props, "className" | "invalid" | "children"> {
  /** Visible label, associated with the control. */
  label: ReactNode;
  /** Error message. When set the field is invalid and the control is described by it. */
  error?: ReactNode;
  /** Helper text, also announced with the control. */
  description?: ReactNode;
  /** The control: an `Input` or any Base UI control. */
  children: ReactNode;
  className?: string;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, error, description, children, className, ...rest },
  ref,
) {
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  return (
    <BaseField.Root ref={ref} invalid={hasError} className={cn("flex flex-col gap-1", className)} {...rest}>
      <BaseField.Label className="text-ink-muted uppercase">{label}</BaseField.Label>
      {children}
      {description ? (
        <BaseField.Description className="text-ink-faint">{description}</BaseField.Description>
      ) : null}
      <BaseField.Error match={hasError} className="text-danger" role="alert">
        {error}
      </BaseField.Error>
    </BaseField.Root>
  );
});
