import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { buttonClasses } from "./button";
import type { ButtonIntent } from "./button";
import { Tooltip } from "./tooltip";

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  /** @default "default" */
  intent?: ButtonIntent;
  icon?: ReactNode;
  /** Marks the link as the current page (`aria-current="page"`). */
  active?: boolean;
  /** Tooltip text; for an icon-only link it is also the accessible name. */
  tip?: ReactNode;
  className?: string;
}

/** The look of `Button` for navigation: a real anchor. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { intent = "default", icon, active, tip, className, children, ...rest },
  ref,
) {
  const hasChildren = children !== undefined && children !== null && children !== false;
  const iconOnly = !hasChildren && icon !== undefined;
  const label = rest["aria-label"] ?? (iconOnly && typeof tip === "string" ? tip : undefined);
  const link = (
    <a
      ref={ref}
      data-intent={intent}
      data-active={active ? "" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(buttonClasses(intent, iconOnly, false), className)}
      {...rest}
      {...(label !== undefined ? { "aria-label": label } : {})}
    >
      {icon}
      {children}
    </a>
  );
  return tip ? <Tooltip tip={tip}>{link}</Tooltip> : link;
});
