import { forwardRef, useId } from "react";
import type { ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "../lib/cn";

export interface SwitchProps extends Omit<BaseSwitch.Root.Props, "className" | "children" | "render"> {
  /** The visible text; it is also the accessible name. */
  label: ReactNode;
  /** Helper text under the label, announced with the switch. */
  description?: ReactNode;
  className?: string;
}

/** An on/off preference that applies immediately: `role="switch"` with `aria-checked`. Use Checkbox for choices that wait for a submit. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ label, description, className, ...rest }, ref) {
  const descriptionId = useId();
  return (
    <div className={cn("flex flex-col", className)}>
      <label className="flex min-h-[var(--control-h)] cursor-pointer items-center gap-3 data-[disabled]:cursor-not-allowed" data-disabled={rest.disabled ? "" : undefined}>
        <BaseSwitch.Root
          ref={ref}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded border border-line-strong bg-surface p-0.5 outline-none",
            "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink-muted",
            "data-[checked]:border-ok-line data-[checked]:bg-ok-soft data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          )}
          {...rest}
        >
          <BaseSwitch.Thumb className="block size-3.5 rounded bg-line-strong transition-transform data-[checked]:translate-x-4 data-[checked]:bg-ok" />
        </BaseSwitch.Root>
        <span className="min-w-0 text-ink">{label}</span>
      </label>
      {description ? (
        <span id={descriptionId} className="pl-12 text-ink-faint">
          {description}
        </span>
      ) : null}
    </div>
  );
});
