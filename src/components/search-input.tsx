import { forwardRef } from "react";
import type { KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Input } from "./input";
import type { InputProps } from "./input";

export interface SearchInputProps extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "onKeyDown" | "type"> {
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name. @default "Search" */
  label?: string;
  /** Label of the clear button. @default "Clear search" */
  clearLabel?: string;
}

/** Search box with a magnifier and a clear button; Escape clears too. The ref reaches the input, so an app can focus it on `/`. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, label = "Search", clearLabel = "Clear search", className, onKeyDown, ...rest },
  ref,
) {
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.key === "Escape" && value !== "") {
      e.stopPropagation();
      onValueChange("");
    }
  };
  return (
    <div className={cn("relative min-w-48 flex-1 sm:max-w-sm", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-ink-faint" />
      <Input ref={ref} type="search" aria-label={label} value={value} onChange={(e) => onValueChange(e.target.value)} onKeyDown={onKey} className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden" {...rest} />
      {value !== "" ? (
        <Button
          icon={<X aria-hidden="true" className="size-3" />}
          aria-label={clearLabel}
          onClick={() => onValueChange("")}
          className="absolute top-0 right-0 border-transparent"
        />
      ) : null}
    </div>
  );
});
