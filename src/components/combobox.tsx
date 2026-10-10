import { useMemo } from "react";
import type { ReactNode } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useOptionTip } from "../lib/use-option-tip";
import { usePanel } from "../lib/bottom-panel";
import { usePortalContainer } from "../lib/theme-scope";
import { Adornment } from "./adornment";
import type { AdornmentProps } from "./adornment";
import { OptionAdornment } from "./select";
import type { Option } from "./select";

interface Common extends AdornmentProps {
  options: Option[];
  /** Accessible name. */
  label: string;
  placeholder?: string;
  /** Shown when the typed text matches nothing. @default "No matches" */
  emptyLabel?: string;
  disabled?: boolean;
  /**
   * Called with the value of the option that is pointed at or reached with the keys while the list is open, and with `null`
   * when no option is highlighted or the list closes: to preview a choice and put things back on `null`.
   */
  onHighlight?: (value: string | null) => void;
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

const popup = "anim-fade panel-inverse panel-float z-50 max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] min-w-56 overflow-y-auto overscroll-contain p-1 text-ink outline-none";
const itemClass =
  "flex min-h-[var(--target-h)] cursor-pointer items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised";

/** Search-as-you-type list for long option lists such as assignees or labels; with `multiple`, the chosen options show as chips. */
export function Combobox(props: ComboboxProps) {
  const { options, label, placeholder, emptyLabel = "No matches", disabled, onHighlight, className, startAdornment, endAdornment } = props;
  const tips = useMemo(() => new Map(props.options.filter((o) => o.tip !== undefined).map((o) => [o.value, o.tip as ReactNode])), [props.options]);
  const { ref: highlightRef, tip, describedBy } = useOptionTip(tips, onHighlight);
  const container = usePortalContainer();
  const panel = usePanel();
  const items = useMemo(() => BaseCombobox.createItems(options, { getValue: (o) => o.value, getLabel: (o) => o.label }), [options]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const list = (
    <BaseCombobox.Portal container={container}>
      {panel.backdropClass ? <BaseCombobox.Backdrop className={panel.backdropClass} /> : null}
      <BaseCombobox.Positioner sideOffset={4} align="start" style={panel.style} className="z-50 outline-none">
        <BaseCombobox.Popup ref={highlightRef} className={panel.popupClass(popup, "max-h-[45dvh] px-1")}>
          {panel.handle}
          <BaseCombobox.Empty className="px-2 py-1 text-ink-faint empty:hidden">{emptyLabel}</BaseCombobox.Empty>
          <BaseCombobox.List>
            {(o: Option) => (
              <BaseCombobox.Item key={o.value} value={o.value} data-option-value={o.value} aria-describedby={describedBy(o.value)} className={itemClass}>
                {o.adornment !== undefined ? <OptionAdornment>{o.adornment}</OptionAdornment> : null}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.count !== undefined ? <span className="text-ink-faint">{o.count}</span> : null}
                <BaseCombobox.ItemIndicator className="shrink-0">
                  <Check aria-hidden="true" className="size-3" />
                </BaseCombobox.ItemIndicator>
              </BaseCombobox.Item>
            )}
          </BaseCombobox.List>
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
      {tip}
    </BaseCombobox.Portal>
  );

  if (props.multiple) {
    return (
      <BaseCombobox.Root items={items} multiple value={props.value} onValueChange={props.onValueChange} onOpenChange={(o) => panel.onOpenChange(o)} disabled={disabled}>
        <BaseCombobox.InputGroup className={cn("input flex h-auto min-h-[var(--target-h)] w-72 max-w-full flex-wrap items-center gap-1 py-[calc((var(--target-h)-1.6em-2px)/2)]", className)}>
          <BaseCombobox.Chips className="flex w-full flex-wrap items-center gap-1">
            {startAdornment !== undefined ? <Adornment>{startAdornment}</Adornment> : null}
            {props.value.map((v) => (
              <BaseCombobox.Chip key={v} aria-label={byValue.get(v)?.label ?? v} className="chip h-5 gap-1 px-1.5 outline-none focus-within:border-line-strong">
                {byValue.get(v)?.label ?? v}
                <BaseCombobox.ChipRemove aria-label={`Remove ${byValue.get(v)?.label ?? v}`} className="flex size-4 cursor-pointer items-center justify-center hover:text-ink">
                  <X aria-hidden="true" className="size-3" />
                </BaseCombobox.ChipRemove>
              </BaseCombobox.Chip>
            ))}
            <BaseCombobox.Input aria-label={label} placeholder={props.value.length > 0 ? "" : (placeholder ?? label)} className="min-w-16 flex-1 bg-transparent outline-none" />
            {endAdornment !== undefined ? <Adornment>{endAdornment}</Adornment> : null}
          </BaseCombobox.Chips>
        </BaseCombobox.InputGroup>
        {list}
      </BaseCombobox.Root>
    );
  }

  // The chosen option's adornment shows at the start of the closed field, like a start adornment.
  const start = startAdornment ?? (props.value !== null ? byValue.get(props.value)?.adornment : undefined);
  if (start !== undefined || endAdornment !== undefined) {
    // With an adornment the border belongs to the group, which holds the adornments, the input and the two buttons.
    return (
      <BaseCombobox.Root items={items} value={props.value} onValueChange={props.onValueChange} onOpenChange={(o) => panel.onOpenChange(o)} disabled={disabled}>
        <BaseCombobox.InputGroup className={cn("input flex w-56 max-w-full items-center gap-2 pr-0", className)}>
          {start !== undefined ? <Adornment>{start}</Adornment> : null}
          <BaseCombobox.Input aria-label={label} placeholder={placeholder ?? label} className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit outline-none" />
          {endAdornment !== undefined ? <Adornment>{endAdornment}</Adornment> : null}
          <div className="flex h-full shrink-0 items-center">
            <BaseCombobox.Clear aria-label="Clear" className="flex size-7 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
              <X aria-hidden="true" className="size-3" />
            </BaseCombobox.Clear>
            <BaseCombobox.Trigger aria-label="Open list" className="flex size-7 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
              <ChevronDown aria-hidden="true" className="size-3" />
            </BaseCombobox.Trigger>
          </div>
        </BaseCombobox.InputGroup>
        {list}
      </BaseCombobox.Root>
    );
  }

  return (
    <BaseCombobox.Root items={items} value={props.value} onValueChange={props.onValueChange} onOpenChange={(o) => panel.onOpenChange(o)} disabled={disabled}>
      <BaseCombobox.InputGroup className={cn("relative w-56 max-w-full", className)}>
        <BaseCombobox.Input aria-label={label} placeholder={placeholder ?? label} className="input pr-[3.25rem]" />
        <div className="absolute top-0 right-0 flex h-full items-center">
          <BaseCombobox.Clear aria-label="Clear" className="flex size-7 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
            <X aria-hidden="true" className="size-3" />
          </BaseCombobox.Clear>
          <BaseCombobox.Trigger aria-label="Open list" className="flex size-7 cursor-pointer items-center justify-center text-ink-faint hover:text-ink">
            <ChevronDown aria-hidden="true" className="size-3" />
          </BaseCombobox.Trigger>
        </div>
      </BaseCombobox.InputGroup>
      {list}
    </BaseCombobox.Root>
  );
}
