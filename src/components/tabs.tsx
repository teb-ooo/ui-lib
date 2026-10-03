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
  /** Layout classes for the whole component. */
  className?: string;
}

/**
 * Tabs: a row of tabs and one panel at a time. Left and Right (and Home and End) move between tabs, the chosen tab is
 * underlined, and on a narrow screen the row scrolls sideways instead of wrapping. Use `ToggleGroup` to filter, not to
 * switch panels.
 */
export function Tabs({ tabs, value, onValueChange, label, activation = "automatic", keepMounted = false, className }: TabsProps) {
  return (
    <BaseTabs.Root value={value} onValueChange={(v) => onValueChange(String(v))} className={cn("flex min-h-0 flex-col", className)}>
      <BaseTabs.List
        aria-label={label}
        activateOnFocus={activation === "automatic"}
        className="relative flex shrink-0 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <BaseTabs.Tab
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={cn(
              "relative flex h-[var(--control-h)] shrink-0 cursor-pointer items-center gap-2 border-0 border-b-2 border-transparent bg-transparent px-3 whitespace-nowrap text-ink-muted outline-none max-sm:h-11",
              "transition-colors duration-100 hover:text-ink data-[active]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
              "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ink-muted",
            )}
          >
            {t.label}
            {t.badge !== undefined ? <span className="text-ink-faint">{t.badge}</span> : null}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 left-(--active-tab-left) h-0.5 w-(--active-tab-width) bg-ink transition-[left,width] duration-150 ease-out motion-reduce:transition-none" />
      </BaseTabs.List>
      {tabs.map((t) => (
        <BaseTabs.Panel key={t.value} value={t.value} keepMounted={keepMounted} className="min-h-0 flex-1 pt-3 outline-none">
          {t.panel}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
