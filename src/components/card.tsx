import { forwardRef, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../lib/cn";

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
  /** Makes the whole card a button. Without `href` or `onClick` the card is plain content. */
  onClick?: () => void;
  /** Marks the card as the current item (`aria-current`). */
  active?: boolean;
  /** Accessible name when the title alone is not enough. */
  "aria-label"?: string;
  className?: string;
}

const face =
  "panel flex h-full w-full min-w-0 flex-col gap-2 p-3 text-left text-ink outline-none";
const actionable =
  "cursor-pointer transition-colors duration-100 hover:bg-surface-raised focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-ink";

/**
 * A summary of one thing (an app, a project, a person) as a tile. The whole card is the one link or button, so it holds
 * text, chips and status only, never another control. Put several in a `CardGrid`.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { title, description, meta, footer, marker, href, onClick, active, className, ...rest },
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
    className: cn(face, (href !== undefined || onClick !== undefined) && actionable, active && "bg-surface-raised", className),
  };
  return (
    <div role="listitem" className="min-w-0">
      {href !== undefined ? (
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
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
    const cards = [...(root.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [])].filter((c) => c.tabIndex >= 0 && c.tagName !== "DIV");
    const here = cards.findIndex((c) => c === document.activeElement);
    if (here < 0) return;
    let target = here;
    if (e.key === "ArrowRight") target = here + 1;
    else if (e.key === "ArrowLeft") target = here - 1;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = cards.length - 1;
    else {
      const rect = cards[here]!.getBoundingClientRect();
      const down = e.key === "ArrowDown";
      let best = -1;
      let bestScore = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        if (down ? r.top <= rect.top + 1 : r.top >= rect.top - 1) return;
        const score = Math.abs(r.top - rect.top) * 1000 + Math.abs(r.left - rect.left);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      });
      if (best < 0) return;
      target = best;
    }
    const next = cards[Math.min(cards.length - 1, Math.max(0, target))];
    if (!next || next === cards[here]) return;
    e.preventDefault();
    next.focus();
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
