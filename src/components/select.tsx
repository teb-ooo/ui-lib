import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface Option {
  value: string;
  label: string;
  /** Shown after the label, for example how many rows match. */
  count?: number;
}

export interface SelectProps {
  options: Option[];
  /** The chosen value, or null for none. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Accessible name. */
  label: string;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/** Choose one option from a short list. For long lists that need searching use `Combobox`. */
export function Select({ options, value, onValueChange, label, placeholder, disabled, className }: SelectProps) {
  return (
    <BaseSelect.Root items={options} value={value} onValueChange={onValueChange} disabled={disabled}>
      <BaseSelect.Trigger aria-label={label} className={cn("input flex w-56 max-w-full cursor-pointer items-center justify-between gap-2 text-left data-[popup-open]:border-ink-muted data-[disabled]:cursor-not-allowed", className)}>
        <BaseSelect.Value placeholder={placeholder ?? label} className="truncate data-[placeholder]:text-ink-faint" />
        <BaseSelect.Icon className="text-ink-faint">
          <ChevronDown aria-hidden="true" className="size-3" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} className="z-50 outline-none">
          <BaseSelect.Popup className="anim-fade panel panel-float min-w-[var(--anchor-width)] p-1 text-ink outline-none">
            <BaseSelect.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  className="grid h-[var(--control-h)] cursor-pointer grid-cols-[1rem_1fr_auto] items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised"
                >
                  <BaseSelect.ItemIndicator className="col-start-1">
                    <Check aria-hidden="true" className="size-3" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2 truncate">{o.label}</BaseSelect.ItemText>
                  {o.count !== undefined ? <span className="col-start-3 text-ink-faint">{o.count}</span> : null}
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
