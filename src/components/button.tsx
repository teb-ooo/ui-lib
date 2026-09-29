import { forwardRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export type ButtonIntent = "default" | "solid" | "danger";

export interface ButtonProps extends Omit<BaseButton.Props, "className"> {
  /** Visual weight. `default` is outlined, `solid` is the primary action, `danger` is destructive. */
  intent?: ButtonIntent;
  /** Shows a spinner and blocks activation while keeping the button focusable. */
  loading?: boolean;
  className?: string;
}

const intents: Record<ButtonIntent, string> = {
  default: "border-line bg-transparent text-ink hover:bg-surface",
  solid: "border-transparent bg-accent text-on-accent hover:bg-accent/90",
  danger: "border-danger bg-transparent text-danger hover:bg-danger/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { intent = "default", loading = false, disabled, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <BaseButton
      ref={ref}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      data-intent={intent}
      data-loading={loading || undefined}
      className={cn(
        "inline-flex h-(--control-h) select-none items-center justify-center gap-2 rounded-ctl border px-3 font-sans text-base",
        "cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        intents[intent],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </BaseButton>
  );
});
