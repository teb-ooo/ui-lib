import type { ReactElement, ReactNode } from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";
import { PANEL_POPUP, PanelBackdrop, PanelHandle, usePanelStyle, usePhone } from "../lib/bottom-panel";
import { usePortalContainer } from "../lib/theme-scope";
import { Kbd } from "./kbd";
import { renderIconProp } from "../lib/render-icon";
import type { IconProp } from "../lib/render-icon";

interface ItemBase {
  /** Stable key. */
  id: string;
  label: ReactNode;
  /** An element (`<Check />`) or a component (`Check`): both work, like `Button`'s `icon`. */
  icon?: IconProp;
  disabled?: boolean;
}

/** A row that does something when chosen. */
export interface MenuAction extends ItemBase {
  type?: "action";
  onSelect: () => void;
  /** Draws it as destructive (state colour). */
  danger?: boolean;
  /** A shortcut hint such as `mod+k`, drawn at the end. */
  shortcut?: string;
}

/** A row that is on or off; choosing it flips it and leaves the menu open, so several can be set in one visit. */
export interface MenuCheckbox extends ItemBase {
  type: "checkbox";
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MenuSeparator {
  type: "separator";
  id: string;
}

/** A quiet heading over the rows that follow. */
export interface MenuHeading {
  type: "heading";
  id: string;
  label: ReactNode;
}

export type MenuEntry = MenuAction | MenuCheckbox | MenuSeparator | MenuHeading;

export interface MenuProps {
  /** The element that opens it, typically a `Button`. */
  trigger: ReactElement<Record<string, unknown>>;
  items: readonly MenuEntry[];
  /** @default "bottom" */
  side?: "top" | "bottom" | "left" | "right";
  /** @default "start" */
  align?: "start" | "center" | "end";
  /** Layout classes for the panel (the width). */
  className?: string;
}

const row = "flex min-h-[var(--target-h)] cursor-pointer items-center gap-2 rounded px-2 text-ink outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface-raised max-sm:min-h-11";

/**
 * A list of actions anchored to a trigger; the trigger's own name (its text or aria-label) is the menu's name. Arrow keys move, Enter or Space chooses, a letter jumps to a row, Escape closes
 * and focus returns to the trigger. Rows are actions (with an icon, a shortcut hint, or drawn as destructive) or on/off
 * choices; separators and headings group them. Use `Popover` for details and `Select` to choose a value.
 */
export function Menu({ trigger, items, side = "bottom", align = "start", className }: MenuProps) {
  const container = usePortalContainer();
  const phone = usePhone();
  const panelStyle = usePanelStyle();
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal container={container}>
        {phone ? <PanelBackdrop /> : null}
        <BaseMenu.Positioner side={side} align={align} sideOffset={4} collisionPadding={8} style={panelStyle} className="z-50 outline-none">
          <BaseMenu.Popup className={phone ? cn(PANEL_POPUP, "px-1") : cn("anim-fade panel-inverse panel-float min-w-48 p-1 text-ink outline-none", className)}>
            {phone ? <PanelHandle /> : null}
            {items.map((entry) => {
              if (entry.type === "separator") return <BaseMenu.Separator key={entry.id} className="my-1 h-px bg-line" />;
              if (entry.type === "heading")
                return (
                  <div key={entry.id} role="presentation" className="px-2 pt-2 pb-1 text-ink-faint uppercase">
                    {entry.label}
                  </div>
                );
              if (entry.type === "checkbox")
                return (
                  <BaseMenu.CheckboxItem key={entry.id} checked={entry.checked} onCheckedChange={entry.onCheckedChange} disabled={entry.disabled} className={row}>
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <BaseMenu.CheckboxItemIndicator>
                        <Check aria-hidden="true" className="size-3" />
                      </BaseMenu.CheckboxItemIndicator>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  </BaseMenu.CheckboxItem>
                );
              return (
                <BaseMenu.Item key={entry.id} onClick={entry.onSelect} disabled={entry.disabled} className={cn(row, entry.danger && "text-danger")}>
                  <span className="flex size-4 shrink-0 items-center justify-center">{renderIconProp(entry.icon)}</span>
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  {entry.shortcut ? <Kbd shortcut={entry.shortcut} className="shrink-0" /> : null}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
