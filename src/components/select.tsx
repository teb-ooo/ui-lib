import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useOptionTip } from "../lib/use-option-tip";
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
}

export interface SelectProps extends AdornmentProps {
  options: Option[];
  /** The chosen value, or null for none. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Accessible name. */
  label: string;
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

/** An option's adornment at the left edge of a row or of the trigger: full height, running to the edge, over the row's padding. */
export function OptionAdornment({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="-ml-2 flex shrink-0 self-stretch overflow-hidden rounded-l [&>*]:h-full">
      {children}
    </span>
  );
}

/** Choose one option from a short list. For long lists that need searching use `Combobox`. */
export function Select({ options, value, onValueChange, label, placeholder, disabled, onHighlight, className, startAdornment, endAdornment }: SelectProps) {
  const container = usePortalContainer();
  const tips = useMemo(() => new Map(options.filter((o) => o.tip !== undefined).map((o) => [o.value, o.tip as ReactNode])), [options]);
  const { ref: highlightRef, tip, describedBy } = useOptionTip(tips, onHighlight);
  const chosen = options.find((o) => o.value === value);
  return (
    <BaseSelect.Root items={options} value={value} onValueChange={onValueChange} disabled={disabled}>
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
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50 outline-none">
          <BaseSelect.Popup className="anim-fade panel-inverse panel-float min-w-[var(--anchor-width)] p-1 text-ink outline-none">
            <BaseSelect.List ref={highlightRef} className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  data-option-value={o.value}
                  aria-describedby={describedBy(o.value)}
                  className="flex h-[var(--target-h)] cursor-pointer items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised"
                >
                  {o.adornment !== undefined ? <OptionAdornment>{o.adornment}</OptionAdornment> : null}
                  <BaseSelect.ItemText className="min-w-0 flex-1 truncate">{o.label}</BaseSelect.ItemText>
                  {o.count !== undefined ? <span className="text-ink-faint">{o.count}</span> : null}
                  <BaseSelect.ItemIndicator className="shrink-0">
                    <Check aria-hidden="true" className="size-3" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
        {tip}
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
