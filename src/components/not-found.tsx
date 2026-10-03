import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface NotFoundProps {
  /** @default "Nothing here" */
  title?: ReactNode;
  /** What happened and what to do, one sentence. @default "There is nothing at this address." */
  description?: ReactNode;
  /** The way back: a `LinkButton` to the app's start page. */
  action?: ReactNode;
  /**
   * `page` is the whole content column (a route that does not exist); `pane` is for a detail area whose item does not exist,
   * with a smaller heading.
   * @default "page"
   */
  variant?: "page" | "pane";
  className?: string;
}

/**
 * The page or pane for something that is not there: a title, one sentence and the way back. Give it to the router as the
 * not-found component (TanStack Router: `defaultNotFoundComponent`) and use `variant="pane"` when a list's detail item is unknown.
 */
export function NotFound({ title = "Nothing here", description = "There is nothing at this address.", action, variant = "page", className }: NotFoundProps) {
  return (
    <div role="status" className={cn("flex flex-col items-start gap-3", variant === "page" ? "mx-auto w-full max-w-[40rem] px-4 py-8 md:px-6" : "p-4", className)}>
      <h1 className={cn("text-ink", variant === "page" && "display-lg")}>{title}</h1>
      <p className="text-ink-muted">{description}</p>
      {action}
    </div>
  );
}

export interface NotAllowedProps {
  /** @default "Not allowed" */
  title?: ReactNode;
  /** Who may see this, or what to ask for. @default "You may not see this page." */
  description?: ReactNode;
  /** The way back or the way to ask. */
  action?: ReactNode;
  /** `page` is a whole content column; `pane` is for a detail area. @default "page" */
  variant?: "page" | "pane";
  className?: string;
}

/**
 * The page or pane for something the person may not see. Render it from the component after you know who they are
 * (`useIsAdmin()`); do not throw from a route's `beforeLoad`, the router logs that as a console error. Say who may,
 * not only that they may not.
 */
export function NotAllowed({ title = "Not allowed", description = "You may not see this page.", action, variant = "page", className }: NotAllowedProps) {
  return <NotFound title={title} description={description} variant={variant} {...(action !== undefined ? { action } : {})} {...(className !== undefined ? { className } : {})} />;
}
