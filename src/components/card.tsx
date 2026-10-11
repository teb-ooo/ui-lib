import { forwardRef, useRef } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from "react";
import { cn } from "../lib/cn";
import { moveFocusInGrid } from "../lib/grid-keys";

export interface CardProps {
  /** The card's name; it is what a screen reader reads first. */
  title: ReactNode;
  /** One or two lines under the title. */
  description?: ReactNode;
  /** A row of facts under the description: chips, status dots, a version. Wraps. */
  meta?: ReactNode;
  /** A quiet line at the bottom (last activity, an owner), separated by a rule. */
  footer?: ReactNode;
  /** A marker at the top right that asks for attention (a "Needs you" chip). */
  marker?: ReactNode;
  /** Makes the whole card a link. */
  href?: string;
  /**
   * Draws the link with your router's link component, as `LinkButton` does: `render={(props) => <Link to="/worlds/1" {...props} />}`.
   * `props` carries `href` (when given), the card's classes, `data-card`, `aria-*` and `children`; the card is then a real link
   * that navigates without a reload.
   */
  render?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: React.Ref<HTMLAnchorElement>; "data-card": string }) => ReactElement;
  /** Makes the whole card a button. Without `href` or `onClick` the card is plain content. */
  onClick?: () => void;
  /** Marks the card as the current item (`aria-current`). */
  active?: boolean;
  /** Accessible name when the title alone is not enough. */
  "aria-label"?: string;
  className?: string;
}

const face =
  "panel flex h-full w-full min-w-0 flex-col gap-2 bg-transparent p-3 text-left text-ink outline-none";
const actionable =
  "cursor-pointer transition-colors duration-100 hover-invert focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-ink";

/**
 * A summary of one thing (an app, a project, a person) as a tile. The whole card is the one link or button, so it holds
 * text, chips and status only, never another control. Put several in a `CardGrid`.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { title, description, meta, footer, marker, href, render, onClick, active, className, ...rest },
  ref,
) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-ink">{title}</span>
        {marker ? <span className="shrink-0">{marker}</span> : null}
      </span>
      {description ? <span className="line-clamp-2 break-words text-ink-muted">{description}</span> : null}
      {meta ? <span className="flex flex-wrap items-center gap-2">{meta}</span> : null}
      {footer ? <span className="mt-auto border-t border-line pt-2 text-ink-faint">{footer}</span> : null}
    </>
  );
  const ariaLabel = rest["aria-label"];
  const common = {
    "data-card": "",
    ...(active ? { "aria-current": "true" as const } : {}),
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    className: cn(face, (href !== undefined || render !== undefined || onClick !== undefined) && actionable, active && "bg-surface-raised", className),
  };
  return (
    <div role="listitem" className="min-w-0">
      {render ? (
        render({ ref: ref as React.Ref<HTMLAnchorElement>, ...(href !== undefined ? { href } : {}), ...common, ...(onClick ? { onClick } : {}), children: body })
      ) : href !== undefined ? (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...common} onClick={onClick}>
          {body}
        </a>
      ) : onClick !== undefined ? (
        <button ref={ref as React.Ref<HTMLButtonElement>} type="button" onClick={onClick} {...common}>
          {body}
        </button>
      ) : (
        <div ref={ref as React.Ref<HTMLDivElement>} {...common}>
          {body}
        </div>
      )}
    </div>
  );
});

export interface CardGridProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** Accessible name of the list. */
  label: string;
  /** The narrowest a card gets, in rem; columns are as many as fit. One column on a phone. @default 18 */
  minCardWidth?: number;
  className?: string;
}

/**
 * Cards in a responsive grid: as many columns as fit, one on a phone. Tab reaches each card; the arrow keys also move
 * between them (left and right along the row, up and down to the nearest card in the next row), Home and End jump to the ends.
 */
export function CardGrid({ label, minCardWidth = 18, className, children, ...rest }: CardGridProps) {
  const root = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    moveFocusInGrid(e, [...(root.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [])].filter((c) => c.tabIndex >= 0 && c.tagName !== "DIV"));
  };
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow keys move focus between the cards inside the list
    <div
      ref={root}
      role="list"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCardWidth}rem), 1fr))` }}
      {...rest}
    >
      {children}
    </div>
  );
}
