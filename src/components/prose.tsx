import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface ProseProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** Caps the line length at 70 characters (`70ch`) so long text stays readable on a wide screen. @default false */
  measure?: boolean;
  className?: string;
}

/**
 * The look of rich text: wrap rendered HTML (a markdown render, an editor's content) and its headings, paragraphs, lists,
 * quotes, code, rules, links and tables are styled for you. One type size: headings differ by case, style, colour,
 * rules and spacing. Use it for content someone wrote, never for page chrome.
 */
export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose({ measure = false, className, ...rest }, ref) {
  return <div ref={ref} className={cn("prose", measure && "max-w-[70ch]", className)} {...rest} />;
});
