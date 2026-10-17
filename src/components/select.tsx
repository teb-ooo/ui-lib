import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useOptionTip } from "../lib/use-option-tip";
import { usePanel } from "../lib/bottom-panel";
import { usePortalContainer } from "../lib/theme-scope";
import { Adornment } from "./adornment";
import type { AdornmentProps } from "./adornment";

export interface Option {
  value: string;
  label: string;
  /** Shown after the label, for example how many rows match. */
  count?: number;
  /** A sentence about the option, shown beside it while it is highlighted in the open list (no delay, also as the arrow keys move). Wraps at 20rem. */
  tip?: ReactNode;
  /**
   * Drawn at the left edge of the option's row in the open list, edge to edge (it covers the row's padding and its height), and
   * at the start of the closed select while this option is chosen: a colour swatch or gradient, an avatar. Give it its own
   * width (for example `w-24`); it is decoration, hidden from assistive technology, so the label must say what it is.
   */
  adornment?: ReactNode;
  /**
   * A heading for the options that follow it: in a `Select`'s open list consecutive options with the same `group` sit under one
   * quiet heading (small, upper case, faint; not focusable, skipped by the arrow keys and type-ahead), exposed as a `group`
   * named by it. Keep an option's group next to its neighbours'. A `Combobox` does not draw groups yet.
   */
  group?: string;
  /**
   * Not selectable: dimmed, it does nothing when pressed or chosen with Enter (the list stays open), but the arrow keys and the
   * pointer still reach it, so its `tip`
   * can say why ("At most 8 filters."), and `onHighlight` still reports it.
   */
  disabled?: boolean;
}

export interface SelectProps extends AdornmentProps {
  options: Option[];
  /** The chosen value, or null for none. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Accessible name. */
  label: string;
  /** Read after a disabled option's label by a screen reader. @default "unavailable" */
  unavailableLabel?: string;
  /** Shown in the open list when there are no options. @default "No options" */
  emptyLabel?: string;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  disabled?: boolean;
  /**
   * Called with the value of the option that is pointed at or reached with the keys while the list is open, and with `null`
   * when no option is highlighted or the list closes: to preview a choice and put things back on `null`.
   */
  onHighlight?: (value: string | null) => void;
  className?: string;
}

/** Consecutive options that share a `group`, in order; options without one stand alone. */
function groupsOf(options: readonly Option[]): { group: string | undefined; options: Option[] }[] {
  const out: { group: string | undefined; options: Option[] }[] = [];
  for (const o of options) {
    const last = out.at(-1);
    if (last && last.group === o.group && o.group !== undefined) last.options.push(o);
    else if (last && last.group === undefined && o.group === undefined) last.options.push(o);
    else out.push({ group: o.group, options: [o] });
  }
  return out;
}

/** An option's adornment at the left edge of a row or of the trigger: full height, running to the edge, over the row's padding. */
export function OptionAdornment({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="-ml-2 flex shrink-0 self-stretch overflow-hidden rounded-l [&>*]:h-full">
      {children}
    </span>
  );
}

/** Choose one option from a short list. For long lists that need searching use `Combobox`. */
export function Select({ options, value, onValueChange, label, placeholder, emptyLabel = "No options", unavailableLabel = "unavailable", disabled, onHighlight, className, startAdornment, endAdornment }: SelectProps) {
  const container = usePortalContainer();
  const panel = usePanel();
  const phone = panel.phone;
  const disabledValues = useMemo(() => new Set(options.filter((o) => o.disabled).map((o) => o.value)), [options]);
  const rejected = useRef(false);
  const tips = useMemo(() => new Map(options.filter((o) => o.tip !== undefined).map((o) => [o.value, o.tip as ReactNode])), [options]);
  const { ref: highlightRef, tip, describedBy } = useOptionTip(tips, onHighlight);
  const chosen = options.find((o) => o.value === value);
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      // A disabled option is reachable (so its tip can say why) but inert: choosing it changes nothing and keeps the list open.
      onValueChange={(v, details) => {
        if (v !== null && disabledValues.has(v)) {
          rejected.current = true;
          details.cancel();
          return;
        }
        (onValueChange as (v: string | null, d?: unknown) => void)(v, details);
      }}
      onOpenChange={(o, details) => {
        if (!o && rejected.current) {
          rejected.current = false;
          details.cancel();
          return;
        }
        panel.onOpenChange(o);
      }}
      disabled={disabled}
    >
      <BaseSelect.Trigger aria-label={label} className={cn("input flex w-56 max-w-full cursor-pointer items-center justify-between gap-2 text-left data-[disabled]:cursor-not-allowed", className)}>
        {startAdornment !== undefined ? <Adornment>{startAdornment}</Adornment> : null}
        {chosen?.adornment !== undefined ? <OptionAdornment>{chosen.adornment}</OptionAdornment> : null}
        <BaseSelect.Value placeholder={placeholder ?? label} className="min-w-0 flex-1 truncate data-[placeholder]:text-ink-faint" />
        {endAdornment !== undefined ? <Adornment>{endAdornment}</Adornment> : null}
        <BaseSelect.Icon className="text-ink-faint">
          <ChevronDown aria-hidden="true" className="size-3" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={container}>
        {panel.backdropClass ? <BaseSelect.Backdrop className={panel.backdropClass} /> : null}
        <BaseSelect.Positioner sideOffset={4} align="start" alignItemWithTrigger={false} style={panel.style} className="z-50 outline-none">
          <BaseSelect.Popup className={panel.popupClass("anim-fade panel-inverse panel-float min-w-[var(--anchor-width)] p-1 text-ink outline-none")}>
            {options.length === 0 ? <p className="px-2 py-1 text-ink-faint">{emptyLabel}</p> : null}
            <BaseSelect.List ref={highlightRef} className={phone ? "" : "max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain"}>
              {groupsOf(options).map((g, i) => {
                const items = g.options.map((o) => (
                  <BaseSelect.Item
                    key={o.value}
                    value={o.value}
                    {...(o.disabled ? { "data-disabled": "" } : {})}
                    data-option-value={o.value}
                    aria-describedby={describedBy(o.value)}
                    className="flex h-[var(--target-h)] cursor-pointer items-center gap-2 rounded px-2 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-surface-raised"
                  >
                    {o.adornment !== undefined ? <OptionAdornment>{o.adornment}</OptionAdornment> : null}
                    <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{o.label}</BaseSelect.ItemText>
                    {/* Not aria-disabled: the list's keyboard navigation would then skip it, and its tip says why it is off. */}
                    {o.disabled ? <span className="sr-only">{unavailableLabel}</span> : null}
                    {o.count !== undefined ? <span className="text-ink-faint">{o.count}</span> : null}
                    <BaseSelect.ItemIndicator className="shrink-0">
                      <Check aria-hidden="true" className="size-3" />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ));
                return g.group === undefined ? (
                  items
                ) : (
                  <BaseSelect.Group key={`${g.group}-${i}`}>
                    <BaseSelect.GroupLabel className="px-2 pt-2 pb-1 text-ink-muted uppercase">{g.group}</BaseSelect.GroupLabel>
                    {items}
                  </BaseSelect.Group>
                );
              })}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
        {tip}
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
