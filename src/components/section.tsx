import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Container } from "./container";
import type { ContainerWidth } from "./container";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "className" | "title"> {
  /** A heading for the section. At the body size; a page title is `PageHeader`. */
  title?: ReactNode;
  description?: ReactNode;
  /** Controls at the right of the heading (buttons, a view switch). They sit beside a short title and wrap under a long one (the title keeps at least 11rem). */
  actions?: ReactNode;
  /**
   * Where the section's rule runs. A rule is a full-width line: it goes from edge to edge of the content area, never
   * inset to the gutter. `bottom` separates this section from the next.
   * @default "bottom"
   */
  rule?: "bottom" | "top" | "both" | "none";
  /** Width of the content inside; the rule is always full width. @default "full" */
  width?: ContainerWidth;
  /** Stays at the top while the page scrolls (a header on a phone, where the whole page scrolls as one). */
  sticky?: boolean;
  className?: string;
}

/**
 * A band of a page: full-width rule above or below, content inset by the page gutter. Sections stack to make a page whose
 * lines run to the edges and separate its parts clearly (a header, a toolbar, a list, a footer).
 */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { title, description, actions, rule = "bottom", width = "full", sticky = false, className, children, ...rest },
  ref,
) {
  const heading = title !== undefined || actions !== undefined || description !== undefined;
  return (
    <section ref={ref} data-bleed="" className={cn("w-full", sticky && "sticky top-0 z-10 bg-ground", (rule === "bottom" || rule === "both") && "border-b border-line", (rule === "top" || rule === "both") && "border-t border-line", className)} {...rest}>
      <Container width={width} className="flex flex-col gap-3 py-3">
        {heading ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-[min(100%,11rem)] flex-1 flex-col gap-1">
              {title !== undefined ? <h2 className="text-ink">{title}</h2> : null}
              {description ? <p className="text-ink-muted">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
});

export interface PageHeaderProps extends Omit<SectionProps, "title" | "rule"> {
  /** The page title: at the display size, or at the body size with `size="compact"`. */
  title: ReactNode;
  /**
   * `default`: display-size title, a sentence under it, a rule under the band. `compact`: one row about 45px high with the
   * title at the body size, the sentence muted beside it, the children (filters) in the middle and the actions at the right;
   * use it for a table screen, or for the title of a record shown in a split pane.
   * @default "default"
   */
  size?: "default" | "compact";
}

/** The top band of a page: the title at the display size, a sentence, the page's main actions, and a full-width rule under it. */
export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader({ title, description, actions, size = "default", width = "full", sticky = false, className, children, ...rest }, ref) {
  if (size === "compact") {
    return (
      <section ref={ref} data-bleed="" className={cn("w-full border-b border-line", sticky && "sticky top-0 z-10 bg-ground", className)} {...rest}>
        <Container width={width} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
          <h1 className="min-w-0 break-words text-ink">{title}</h1>
          {description ? <p className="min-w-0 truncate text-ink-muted">{description}</p> : null}
          {children ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div> : <div className="flex-1" />}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </Container>
      </section>
    );
  }
  return (
    <section ref={ref} data-bleed="" className={cn("w-full border-b border-line", sticky && "sticky top-0 z-10 bg-ground", className)} {...rest}>
      <Container width={width} className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-[min(100%,11rem)] flex-1 flex-col gap-2">
            <h1 className="display-lg break-words text-ink">{title}</h1>
            {description ? <p className="text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </Container>
    </section>
  );
});
