import { Button } from "./button";
import type { Option } from "./select";

interface Common {
  options: Option[];
  /** Accessible name of the group. */
  label: string;
  className?: string;
}
export interface SingleToggleGroupProps extends Common {
  multiple?: false;
  /** The chosen value, or null for none. Choosing it again clears it. */
  value: string | null;
  onValueChange: (value: string | null) => void;
}
export interface MultiToggleGroupProps extends Common {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
}
export type ToggleGroupProps = SingleToggleGroupProps | MultiToggleGroupProps;

/** A group of toggle chips: choose one (clear by choosing it again) or, with `multiple`, any number. Each is a Button with `active`. */
export function ToggleGroup(props: ToggleGroupProps) {
  const { options, label, className } = props;
  const isOn = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (props.multiple) props.onValueChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onValueChange(props.value === v ? null : v);
  };
  return (
    <div role="group" aria-label={label} className={className ? `flex flex-wrap gap-1 ${className}` : "flex flex-wrap gap-1"}>
      {options.map((o) => (
        <Button key={o.value} active={isOn(o.value)} onClick={() => toggle(o.value)}>
          {o.label}
          {o.count !== undefined ? <span className="text-ink-faint">{o.count}</span> : null}
        </Button>
      ))}
    </div>
  );
}
