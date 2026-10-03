import type { ReactNode } from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface AccordionItem {
  value: string;
  /** The header text (it is the button's accessible name). */
  title: ReactNode;
  /** The body, shown while the section is open. */
  content: ReactNode;
  /**
   * A control at the end of the header, beside the button and not inside it: a `Switch` that enables the section, a count,
   * a menu. It stays usable while the section is closed.
   */
  trailing?: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  /** The `value`s of the open sections (controlled). */
  value?: readonly string[];
  /** The sections open at first (uncontrolled). */
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** Allow several sections open at once. @default true */
  multiple?: boolean;
  /** Layout classes. */
  className?: string;
}

/**
 * Sections you open and close, one header each: Enter or Space toggles, Up and Down move between headers. Each header can
 * carry a trailing control (a `Switch`, a count) that is not part of the toggle button.
 */
export function Accordion({ items, value, defaultValue, onValueChange, multiple = true, className }: AccordionProps) {
  return (
    <BaseAccordion.Root
      multiple={multiple}
      {...(value ? { value: [...value] } : {})}
      {...(defaultValue ? { defaultValue: [...defaultValue] } : {})}
      onValueChange={(v) => onValueChange?.([...(v as string[])])}
      className={cn("flex flex-col divide-y divide-line border-y border-line", className)}
    >
      {items.map((item) => (
        <BaseAccordion.Item key={item.value} value={item.value} disabled={item.disabled} className="group/section">
          <BaseAccordion.Header className="m-0 flex items-center gap-2">
            <BaseAccordion.Trigger
              className={cn(
                "flex min-h-[var(--control-h)] min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent px-1 text-left text-ink uppercase outline-none max-sm:min-h-11",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                "focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ink-muted",
                "[&[data-panel-open]>svg]:rotate-90",
              )}
            >
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-faint transition-transform duration-150 ease-out" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </BaseAccordion.Trigger>
            {item.trailing ? <div className="flex shrink-0 items-center">{item.trailing}</div> : null}
          </BaseAccordion.Header>
          <BaseAccordion.Panel className="anim-collapse px-1 pt-1 pb-3 text-ink">{item.content}</BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

export interface CollapsibleProps {
  title: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trailing?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** One section that opens and closes: an `Accordion` with a single item. */
export function Collapsible({ title, children, open, defaultOpen, onOpenChange, trailing, disabled, className }: CollapsibleProps) {
  return (
    <Accordion
      items={[{ value: "section", title, content: children, trailing, disabled }]}
      {...(open !== undefined ? { value: open ? ["section"] : [] } : {})}
      {...(defaultOpen !== undefined ? { defaultValue: defaultOpen ? ["section"] : [] } : {})}
      onValueChange={(v) => onOpenChange?.(v.includes("section"))}
      className={className}
    />
  );
}
