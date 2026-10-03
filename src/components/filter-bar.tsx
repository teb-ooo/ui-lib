import { Children, forwardRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useMinWidth } from "../hooks/use-media-query";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Sheet } from "./sheet";

export interface FilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /** Controls on the right (a result count, a view menu). They wrap under the rest on a phone. */
  end?: ReactNode;
  /**
   * The controls that stay on screen on a phone (normally the SearchInput and the main action). When set, the
   * `children` filters move into a bottom sheet behind a "Filters" button below the sm breakpoint, so the bar is one row.
   */
  primary?: ReactNode;
  /** Label of the button and the sheet that hold the filters on a phone. @default "Filters" */
  filtersLabel?: string;
  /**
   * Where `end` goes on a phone when `primary` collapses the filters: `sheet` puts it at the top of the Filters sheet so the
   * bar stays one row; `row` keeps it in the bar (it wraps under the search when there is no room).
   * @default "sheet"
   */
  collapsedEnd?: "sheet" | "row";
  /** How many filters are set; shown on the phone button so a hidden filter is not forgotten. */
  activeCount?: number;
  className?: string;
}

/**
 * A row of filter controls that wraps on a phone: SearchInput, ToggleGroup, Select, Combobox, ViewMenu.
 * With `primary` the bar stays one row on a phone and the filters open in a sheet.
 */
export const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(function FilterBar(
  { end, primary, filtersLabel = "Filters", collapsedEnd = "sheet", activeCount = 0, className, children, ...rest },
  ref,
) {
  const wide = useMinWidth("sm");
  const [open, setOpen] = useState(false);
  const hasFilters = Children.toArray(children).length > 0;
  const collapsed = primary !== undefined && !wide && hasFilters;
  const endInSheet = collapsed && collapsedEnd === "sheet" && Boolean(end);
  return (
    <div ref={ref} role="group" className={cn("flex flex-wrap items-center gap-2", className)} {...rest}>
      {primary}
      {collapsed ? (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title={filtersLabel}
          trigger={
            <Button icon={<SlidersHorizontal aria-hidden="true" className="size-4" />}>
              {filtersLabel}
              {activeCount > 0 ? ` (${activeCount})` : ""}
            </Button>
          }
          footer={<Button onClick={() => setOpen(false)}>Done</Button>}
        >
          <div className="flex flex-col items-stretch gap-2">
            {endInSheet ? <div className="flex flex-wrap items-center gap-2">{end}</div> : null}
            {children}
          </div>
        </Sheet>
      ) : (
        children
      )}
      {end && !endInSheet ? <div className="ml-auto flex flex-wrap items-center gap-2">{end}</div> : null}
    </div>
  );
});
