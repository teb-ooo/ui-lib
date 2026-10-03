import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "../lib/cn";
import { renderIconProp } from "../lib/render-icon";
import type { IconProp } from "../lib/render-icon";
import { buttonClasses } from "./button";
import type { ButtonIntent } from "./button";
import { Tooltip } from "./tooltip";

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  /** @default "default" */
  intent?: ButtonIntent;
  icon?: IconProp;
  /** Marks the link as the current page (`aria-current="page"`). */
  active?: boolean;
  /** Tooltip text; for an icon-only link it is also the accessible name. */
  tip?: ReactNode;
  /** Which side of the link the tip opens on. @default "top" */
  tipSide?: "top" | "bottom" | "left" | "right";
  /**
   * Draws the link with your router's link component: `render={(props) => <Link to="/rules" {...props} />}`. `props` carries
   * the class, aria and children; the anchor's `href` is ignored. Without it the link is a plain anchor (a full page load).
   */
  render?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: React.Ref<HTMLAnchorElement>; "data-intent": string }) => ReactElement;
  className?: string;
}

/** The look of `Button` for navigation: a real anchor. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { intent = "default", icon, active, tip, tipSide = "top", render, className, children, ...rest },
  ref,
) {
  const hasChildren = children !== undefined && children !== null && children !== false;
  const iconOnly = !hasChildren && icon !== undefined;
  const label = rest["aria-label"] ?? (iconOnly && typeof tip === "string" ? tip : undefined);
  const content = (
    <>
      {renderIconProp(icon)}
      {children}
    </>
  );
  const anchorProps = {
    ref,
    "data-intent": intent,
    "data-active": active ? "" : undefined,
    "aria-current": active ? ("page" as const) : undefined,
    className: cn(buttonClasses(intent, iconOnly, false), className),
    ...rest,
    ...(label !== undefined ? { "aria-label": label } : {}),
  };
  const link = render ? render({ ...anchorProps, children: content }) : <a {...anchorProps}>{content}</a>;
  return tip ? <Tooltip tip={tip} side={tipSide}>{link}</Tooltip> : link;
});
