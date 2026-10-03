import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";
import { Tooltip } from "./tooltip";

export type ButtonIntent = "default" | "solid" | "danger" | "warning";

/** Class names shared by `Button` and `LinkButton`. */
export function buttonClasses(intent: ButtonIntent, iconOnly: boolean, dashed: boolean): string {
  return cn(
    "btn",
    intent === "solid" && "btn-solid",
    intent === "danger" && "btn-danger",
    intent === "warning" && "btn-warning",
    iconOnly && "btn-icon",
    dashed && "btn-add",
  );
}

export interface ButtonProps extends Omit<BaseButton.Props, "className"> {
  /**
   * Visual weight. `default` is outlined, `solid` is the primary action, `danger` and `warning` tint the text and hover.
   * @default "default"
   */
  intent?: ButtonIntent;
  /** Icon shown before the children. With no children the button is a square icon button. */
  icon?: ReactNode;
  /** Marks a toggled-on button (sets `aria-pressed`). Leave undefined for a plain action. */
  active?: boolean;
  /** Tooltip text. For an icon-only button it is also the accessible name. */
  tip?: ReactNode;
  /** Draws the dashed "add" affordance. */
  dashed?: boolean;
  /**
   * Shows a spinner and blocks activation while keeping the button focusable.
   * @default false
   */
  loading?: boolean;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { intent = "default", icon, active, tip, dashed = false, loading = false, disabled, className, children, type = "button", ...rest },
  ref,
) {
  const hasChildren = children !== undefined && children !== null && children !== false;
  const iconOnly = !hasChildren && (icon !== undefined || loading);
  const label = rest["aria-label"] ?? (iconOnly && typeof tip === "string" ? tip : undefined);
  const button = (
    <BaseButton
      ref={ref}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      aria-pressed={active}
      data-active={active ? "" : undefined}
      data-intent={intent}
      data-loading={loading || undefined}
      className={cn(buttonClasses(intent, iconOnly, dashed), className)}
      {...rest}
      {...(label !== undefined ? { "aria-label": label } : {})}
    >
      {loading ? (
        <span aria-hidden="true" className="anim-delayed inline-flex">
          <Loader2 className="size-4 animate-spin" />
        </span>
      ) : (
        icon
      )}
      {children}
    </BaseButton>
  );
  return tip ? <Tooltip tip={tip}>{button}</Tooltip> : button;
});
