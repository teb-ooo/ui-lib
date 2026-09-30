import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** Controls on the right (a result count, a view menu). They wrap under the rest on a phone. */
  end?: ReactNode;
  className?: string;
}

/** A row of filter controls that wraps on a phone: SearchInput, ToggleGroup, Select, Combobox, ViewMenu. */
export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar({ end, className, children, ...rest }, ref) {
  return (
    <div ref={ref} role="group" className={cn("flex flex-wrap items-center gap-2", className)} {...rest}>
      {children}
      {end ? <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div> : null}
    </div>
  );
});
