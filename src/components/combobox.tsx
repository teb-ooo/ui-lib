import { useMemo } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "../lib/cn";
import type { Option } from "./select";

interface Common {
  options: Option[];
  /** Accessible name. */
  label: string;
  placeholder?: string;
  /** Shown when the typed text matches nothing. @default "No matches" */
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}
export interface SingleComboboxProps extends Common {
  multiple?: false;
  value: string | null;
  onValueChange: (value: string | null) => void;
}
export interface MultiComboboxProps extends Common {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
}
export type ComboboxProps = SingleComboboxProps | MultiComboboxProps;

const popup = "anim-fade panel panel-float z-50 max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] min-w-56 overflow-y-auto p-1 text-ink outline-none";
const itemClass =
  "grid min-h-[var(--control-h)] cursor-pointer grid-cols-[1rem_1fr_auto] items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised";

/** Search-as-you-type list for long option lists such as assignees or labels; with `multiple`, the chosen options show as chips. */
export function Combobox(props: ComboboxProps) {
  const { options, label, placeholder, emptyLabel = "No matches", disabled, className } = props;
  const items = useMemo(() => BaseCombobox.createItems(options, { getValue: (o) => o.value, getLabel: (o) => o.label }), [options]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const list = (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner sideOffset={4} className="z-50 outline-none">
        <BaseCombobox.Popup className={popup}>
          <BaseCombobox.Empty className="px-2 py-1 text-ink-faint">{emptyLabel}</BaseCombobox.Empty>
          <BaseCombobox.List>
            {(o: Option) => (
              <BaseCombobox.Item key={o.value} value={o.value} className={itemClass}>
                <BaseCombobox.ItemIndicator className="col-start-1">
                  <Check aria-hidden="true" className="size-3" />
                </BaseCombobox.ItemIndicator>
                <span className="col-start-2 truncate">{o.label}</span>
                {o.count !== undefined ? <span className="col-start-3 text-ink-faint">{o.count}</span> : null}
              </BaseCombobox.Item>
            )}
          </BaseCombobox.List>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );

  if (props.multiple) {
    return (
      <BaseCombobox.Root items={items} multiple value={props.value} onValueChange={props.onValueChange} disabled={disabled}>
        <BaseCombobox.InputGroup className={cn("input flex h-auto min-h-[var(--control-h)] w-72 max-w-full flex-wrap items-center gap-1 py-[calc((var(--control-h)-1.6em-2px)/2)] focus-within:border-ink-muted", className)}>
          <BaseCombobox.Chips className="flex w-full flex-wrap items-center gap-1">
            {props.value.map((v) => (
              <BaseCombobox.Chip key={v} aria-label={byValue.get(v)?.label ?? v} className="chip h-5 gap-1 px-1.5 outline-none focus-within:border-line-strong">
                {byValue.get(v)?.label ?? v}
                <BaseCombobox.ChipRemove aria-label={`Remove ${byValue.get(v)?.label ?? v}`} className="flex size-4 cursor-pointer items-center justify-center hover:text-ink">
                  <X aria-hidden="true" className="size-3" />
                </BaseCombobox.ChipRemove>
              </BaseCombobox.Chip>
            ))}
            <BaseCombobox.Input aria-label={label} placeholder={props.value.length > 0 ? "" : (placeholder ?? label)} className="min-w-16 flex-1 bg-transparent outline-none" />
          </BaseCombobox.Chips>
        </BaseCombobox.InputGroup>
        {list}
      </BaseCombobox.Root>
    );
  }

  return (
    <BaseCombobox.Root items={items} value={props.value} onValueChange={props.onValueChange} disabled={disabled}>
      <BaseCombobox.InputGroup className={cn("relative w-56 max-w-full", className)}>
        <BaseCombobox.Input aria-label={label} placeholder={placeholder ?? label} className="input pr-14" />
        <div className="absolute top-0 right-0 flex h-full items-center">
          <BaseCombobox.Clear aria-label="Clear" className="flex size-6 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
            <X aria-hidden="true" className="size-3" />
          </BaseCombobox.Clear>
          <BaseCombobox.Trigger aria-label="Open list" className="flex size-6 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
            <ChevronDown aria-hidden="true" className="size-3" />
          </BaseCombobox.Trigger>
        </div>
      </BaseCombobox.InputGroup>
      {list}
    </BaseCombobox.Root>
  );
}
