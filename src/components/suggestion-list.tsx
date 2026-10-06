import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "../lib/cn";

export interface SuggestionItem {
  id: string;
  /** What is inserted or chosen. */
  label: ReactNode;
  /** Quiet text after the label, such as the entry's type. */
  hint?: ReactNode;
}

export interface SuggestionListProps {
  open: boolean;
  items: SuggestionItem[];
  /** Index of the highlighted item. The editor owns it, because the keys arrive at the editor. */
  activeIndex: number;
  /** Called when the pointer moves over an item. */
  onActiveIndexChange?: (index: number) => void;
  onSelect: (item: SuggestionItem) => void;
  /** Called when a click outside dismisses the list. */
  onClose?: () => void;
  /**
   * Where the list points: a function returning the caret's rectangle (a rich-text editor's suggestion `clientRect`), or an element.
   * It is read each time the list is positioned.
   */
  anchor: (() => DOMRect | null | undefined) | Element | null;
  /** Accessible name of the listbox. */
  label: string;
  /** DOM id of the listbox. Options are `${id}-option-${index}`, for the editor's `aria-controls` and `aria-activedescendant`. @default "suggestions" */
  id?: string;
  /** Shown when there are no items. @default "No matches" */
  emptyLabel?: string;
  className?: string;
}

export interface SuggestionKeyOptions {
  count: number;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Choose the active item (Enter, Tab). */
  onSelect: () => void;
  onClose: () => void;
}

/**
 * The key handling a caret-anchored list needs, for the editor's key hook (a suggestion plugin's `onKeyDown`).
 * Up and Down move and wrap, Enter and Tab choose, Escape closes. Returns whether it handled the key.
 */
export function handleSuggestionKey(event: { key: string; preventDefault?: () => void }, o: SuggestionKeyOptions): boolean {
  const handled = (): true => {
    event.preventDefault?.();
    return true;
  };
  switch (event.key) {
    case "ArrowDown":
      if (o.count === 0) return false;
      o.onActiveIndexChange((o.activeIndex + 1) % o.count);
      return handled();
    case "ArrowUp":
      if (o.count === 0) return false;
      o.onActiveIndexChange((o.activeIndex - 1 + o.count) % o.count);
      return handled();
    case "Enter":
    case "Tab":
      if (o.count === 0) return false;
      o.onSelect();
      return handled();
    case "Escape":
      o.onClose();
      return handled();
    default:
      return false;
  }
}

/**
 * A listbox that opens at the text caret while the editor keeps focus, for `[[` mentions, `@` people or `/` commands.
 * The editor drives it (open, items, active index, keys); the list only draws and positions.
 */
export function SuggestionList({
  open,
  items,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onClose,
  anchor,
  label,
  id = "suggestions",
  emptyLabel = "No matches",
  className,
}: SuggestionListProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  const resolved = typeof anchor === "function" ? () => ({ getBoundingClientRect: () => anchor() ?? new DOMRect() }) : anchor;

  return (
    <Popover.Root open={open} onOpenChange={(next) => (next ? undefined : onClose?.())} modal={false}>
      <Popover.Portal>
        <Popover.Positioner anchor={resolved} side="bottom" align="start" sideOffset={4} className="z-50 outline-none">
          <Popover.Popup
            initialFocus={false}
            finalFocus={false}
            className={cn("anim-fade panel-inverse panel-float max-h-[min(16rem,var(--available-height))] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto p-1 text-ink outline-none", className)}
            // Keep the caret in the editor: a press on the list must not move focus.
            onMouseDown={(e) => e.preventDefault()}
          >
            {items.length === 0 ? (
              <p className="px-2 py-1 text-ink-faint">{emptyLabel}</p>
            ) : (
              <div role="listbox" id={id} aria-label={label} className="flex flex-col">
                {items.map((item, i) => (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- options of the listbox: focus stays in the input (aria-activedescendant) and the keys are handled there
                  <div
                    key={item.id}
                    id={`${id}-option-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    data-active={i === activeIndex ? "" : undefined}
                    ref={i === activeIndex ? activeRef : undefined}
                    onMouseEnter={() => onActiveIndexChange?.(i)}
                    onClick={() => onSelect(item)}
                    className="flex min-h-[var(--control-h)] cursor-pointer items-center justify-between gap-2 rounded px-2 data-[active]:bg-surface-raised"
                  >
                    <span className="truncate">{item.label}</span>
                    {item.hint ? <span className="shrink-0 text-ink-faint">{item.hint}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
