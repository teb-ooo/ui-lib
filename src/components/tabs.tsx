import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "../lib/cn";

export interface TabItem {
  value: string;
  /** The tab's text (it is also its accessible name). */
  label: ReactNode;
  /** The panel shown while the tab is chosen. */
  panel: ReactNode;
  disabled?: boolean;
  /** A small count or marker after the label. */
  badge?: ReactNode;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  /** The chosen tab's `value`. */
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name of the tab list. */
  label: string;
  /**
   * `automatic` shows a tab's panel as soon as the arrow keys reach it; `manual` waits for Enter or Space, for panels that are
   * slow or costly to show. @default "automatic"
   */
  activation?: "automatic" | "manual";
  /** Keep every panel mounted (hidden) so their state survives switching. @default false */
  keepMounted?: boolean;
  /**
   * The panels fill the height under the tab row and scroll inside it (a `flex` column), so a table or a form can fill the
   * tabs' screen. Use it only when the tabs are the body of a `Page`: there must not be another scroller around them.
   * @default false
   */
  fill?: boolean;
  /**
   * Line the first tab's text up with the page gutter (16px, 24px from `md`), for tabs that sit directly under a `PageHeader`
   * or in a `PageBody` with `gutter`. @default false
   */
  gutter?: boolean;
  /** Layout classes for the whole component. */
  className?: string;
}

/**
 * Tabs: a row of tabs and one panel at a time. Left and Right (and Home and End) move between tabs, the chosen tab sits on a raised
 * pill that zips (stretches and bounces) from tab to tab, and on a narrow screen the row scrolls sideways instead of wrapping. Use `ToggleGroup` to filter, not to
 * switch panels.
 */
export function Tabs({ tabs, value, onValueChange, label, activation = "automatic", keepMounted = false, fill = false, gutter = false, className }: TabsProps) {
  const indicator = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  // The pill zips: it stretches and leans while it travels, then settles with a small bounce (left and width are the
  // transition; this is the squash on top).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = indicator.current;
    if (!el || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: "scaleX(1) skewX(0deg)" },
        { transform: "scaleX(1.18) skewX(-14deg)", offset: 0.35 },
        { transform: "scaleX(0.96) skewX(4deg)", offset: 0.75 },
        { transform: "scaleX(1) skewX(0deg)" },
      ],
      { duration: 380, easing: "ease-out" },
    );
  }, [value]);
  return (
    <BaseTabs.Root value={value} onValueChange={(v) => onValueChange(String(v))} className={cn("flex min-h-0 flex-col", className)}>
      <BaseTabs.List
        aria-label={label}
        activateOnFocus={activation === "automatic"}
        className={cn("relative flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", gutter && "px-1 md:px-3")}
      >
        {tabs.map((t) => (
          <BaseTabs.Tab
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={cn(
              "relative z-10 flex h-[var(--control-h)] shrink-0 cursor-pointer items-center gap-2 rounded border-0 bg-transparent px-3 whitespace-nowrap text-ink-muted outline-none max-sm:h-11",
              "transition-colors duration-100 hover:text-ink data-[active]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
              "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ink-muted",
            )}
          >
            {t.label}
            {t.badge !== undefined ? <span className="text-ink-faint">{t.badge}</span> : null}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator
          ref={indicator}
          className="absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded border border-line bg-surface-raised transition-[left,width] duration-[360ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
        />
      </BaseTabs.List>
      {tabs.map((t) => (
        <BaseTabs.Panel key={t.value} value={t.value} keepMounted={keepMounted} className={cn("min-h-0 flex-1 pt-3 outline-none", fill && "flex flex-col overflow-auto")}>
          {t.panel}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
