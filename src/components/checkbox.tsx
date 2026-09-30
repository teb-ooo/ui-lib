import { forwardRef } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/cn";

export interface CheckboxProps extends Omit<BaseCheckbox.Root.Props, "className" | "children"> {
  /** Accessible name when there is no visible label. */
  "aria-label"?: string;
  className?: string;
}

/** A checkbox: checked, unchecked or indeterminate. Give it an aria-label, or wrap it in a label. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ className, ...rest }, ref) {
  return (
    <BaseCheckbox.Root
      ref={ref}
      className={cn(
        "inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-line-strong bg-surface text-ink outline-none",
        "hover:border-ink-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink-muted",
        "data-[checked]:bg-surface-raised data-[indeterminate]:bg-surface-raised data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...rest}
    >
      <BaseCheckbox.Indicator keepMounted={false} className="flex">
        {rest.indeterminate ? <Minus aria-hidden="true" className="size-3" /> : <Check aria-hidden="true" className="size-3" />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
});
