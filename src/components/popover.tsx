import { cloneElement, useId, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface Shared {
  /** The element that opens it: a `Button`, `LinkButton` or any focusable element. */
  trigger: ReactElement<Record<string, unknown>>;
  /** Which side of the trigger it opens on. @default "bottom" ("top" for a tip) */
  side?: Side;
  /** @default "center" */
  align?: Align;
  /** Layout classes for the panel (the width). */
  className?: string;
}

/** Opens on click or Enter and holds anything: a status, fields, a list. Focus goes in and returns to the trigger on close. */
export interface ClickPopoverProps extends Shared {
  openOn?: "click";
  /** Accessible name of the panel; drawn as its heading when `showTitle`. */
  title: string;
  /** Draw `title` as a heading at the top. @default false */
  showTitle?: boolean;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `true` blocks the rest of the page; `false` leaves it usable and closes on Escape or an outside press. @default false */
  modal?: boolean;
  /** A close button in the corner (Escape always works). @default false */
  showClose?: boolean;
  /** Label of the close button. @default "Close" */
  closeLabel?: string;
}

/**
 * A hover card: opens when the pointer rests on the trigger (and on click or Enter, so the keyboard and a touch screen
 * reach it), stays while the pointer is on it, holds anything, closes on Escape. Focus stays on the trigger until the
 * person moves into it.
 */
export interface HoverCardProps extends Shared {
  openOn: "hover";
  title: string;
  showTitle?: boolean;
  children: ReactNode;
  tip?: undefined;
  /** Milliseconds the pointer rests before it opens. @default 300 */
  delay?: number;
  /** Milliseconds before it closes after the pointer leaves. @default 150 */
  closeDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A tip: one short line shown on hover and keyboard focus, announced as the trigger's description. It cannot be entered
 * or clicked, so it never holds a control. This is what `tip` on `Button` and `LinkButton` uses.
 */
export interface TipProps extends Shared {
  openOn: "hover";
  /** The text. The one tooltip mechanism: never a `title` attribute. */
  tip: ReactNode;
  children?: undefined;
  /** Milliseconds before it opens. @default 400 */
  delay?: number;
}

export type PopoverProps = ClickPopoverProps | HoverCardProps | TipProps;

const panel = "anim-fade panel panel-float text-ink outline-none";

function Tip({ tip, trigger, side = "top", align = "center", delay = 400 }: TipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  // While it is open the trigger is described by the tip, so a screen reader reads both. A trigger that is already named
  // by its own aria-label (an icon-only button takes the tip as its label) is not described again.
  const named = trigger.props["aria-label"] !== undefined;
  const described = open && !named ? cloneElement(trigger, { "aria-describedby": id }) : trigger;
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root onOpenChange={setOpen}>
        <BaseTooltip.Trigger delay={delay} render={described} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} align={align} sideOffset={6} className="z-50">
            <BaseTooltip.Popup id={id} role="tooltip" className={cn(panel, "px-2")}>
              {tip}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

/**
 * One anchored panel in three modes, chosen by `openOn` and by what it holds:
 * - `openOn="click"` (default): a popover for details that need interaction.
 * - `openOn="hover"` with `children`: a hover card, the same panel opened by hovering as well as by click and Enter.
 * - `openOn="hover"` with `tip`: a tooltip, one line of text that is never interactive.
 * The types keep the combinations that cannot work out of reach: a tip has no children and no close button, a panel that
 * holds controls is always reachable from the keyboard. Use `Dialog` for something that needs an answer.
 */
export function Popover(props: PopoverProps) {
  if (props.openOn === "hover" && props.tip !== undefined) return <Tip {...props} />;
  const p = props as ClickPopoverProps | HoverCardProps;
  const { trigger, title, children, side = "bottom", align = "center", className } = p;
  const hover = p.openOn === "hover";
  const click = p as ClickPopoverProps;
  const card = p as HoverCardProps;
  const showTitle = p.showTitle ?? false;
  const showClose = !hover && (click.showClose ?? false);
  return (
    <BasePopover.Root
      open={p.open}
      defaultOpen={p.defaultOpen}
      onOpenChange={p.onOpenChange ? (o) => p.onOpenChange?.(o) : undefined}
      modal={hover ? false : (click.modal ?? false)}
    >
      <BasePopover.Trigger
        render={trigger}
        {...(hover ? { openOnHover: true, delay: card.delay ?? 300, closeDelay: card.closeDelay ?? 150 } : {})}
      />
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <BasePopover.Popup aria-label={title} className={cn(panel, "flex w-72 max-w-[calc(100vw-1rem)] flex-col gap-2 p-3", className)}>
            {showTitle || showClose ? (
              <div className="flex items-start justify-between gap-3">
                {showTitle ? <BasePopover.Title className="text-ink">{title}</BasePopover.Title> : <span />}
                {showClose ? <BasePopover.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={click.closeLabel ?? "Close"} className="border-transparent" />} /> : null}
              </div>
            ) : null}
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
