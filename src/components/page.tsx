import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface PageProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
}

/**
 * The frame of one screen inside the Shell: fixed bands (a `PageHeader`, a `Section` with the filters) above exactly one
 * scroll surface (`PageBody`). From the lg breakpoint it fills the Shell's content area and the bands stay put; below lg
 * nothing is fixed and the Shell's content area scrolls the whole page as one.
 */
export const Page = forwardRef<HTMLDivElement, PageProps>(function Page({ className, ...rest }, ref) {
  return <div ref={ref} className={cn("flex min-h-full flex-col lg:h-full lg:min-h-0", className)} {...rest} />;
});

export interface PageBodyProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /**
   * The body holds one `DataTable` or `SplitPane` that fills it and scrolls itself (a table screen): no scroll surface
   * here, so there is never a scroller inside a scroller. Leave it false for a document screen (a form, a note, a list of
   * sections): the body is the one scroll surface from lg.
   * @default false
   */
  fill?: boolean;
  /**
   * Gives every direct child the page gutter (16px, 24px from md) except bleed tables, `Section` and `PageHeader` bands
   * (they run edge to edge and inset their own content), so text is inset and rules touch both edges.
   * @default false
   */
  gutter?: boolean;
  className?: string;
}

/** The one scroll surface of a `Page` (document screen), or the box a table or split pane fills (`fill`). */
export const PageBody = forwardRef<HTMLDivElement, PageBodyProps>(function PageBody({ fill = false, gutter = false, className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-1 flex-col lg:min-h-0",
        fill ? "lg:overflow-hidden" : "lg:overflow-auto",
        gutter && "[&>:not([data-bleed])]:px-4 md:[&>:not([data-bleed])]:px-6",
        className,
      )}
      {...rest}
    />
  );
});

export interface PageColumnsProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** Width of the first column in rem from lg; the second takes the rest. @default 24 */
  firstWidth?: number;
  className?: string;
}

/**
 * Two columns side by side from lg, each a `PageBody` with its own scroll surface (a record's details beside its tabs);
 * below lg they stack in source order and the page scrolls as one. To show the second column first on a phone give it
 * `max-lg:order-first`.
 */
export const PageColumns = forwardRef<HTMLDivElement, PageColumnsProps>(function PageColumns({ firstWidth = 24, className, style, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[var(--first-column)_minmax(0,1fr)] lg:divide-x lg:divide-line", className)}
      style={{ ["--first-column" as string]: `${firstWidth}rem`, ...style }}
      {...rest}
    />
  );
});
