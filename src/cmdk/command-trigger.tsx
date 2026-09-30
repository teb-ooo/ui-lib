import { Search } from "lucide-react";
import { Button, Kbd } from "@teb-ooo/ui";
import { usePaletteApi } from "./context";

export interface CommandTriggerProps {
  /** Layout utilities only. */
  className?: string;
}

/**
 * The visible way to open the palette: search icon, label and shortcut hint on desktop; an icon-only
 * square button below 640px, which is what phone users tap. The label and hint are hidden with CSS
 * breakpoints, so the button is named for assistive tech either way.
 */
export function CommandTrigger({ className }: CommandTriggerProps) {
  const { open, isOpen } = usePaletteApi();
  return (
    <Button
      icon={<Search aria-hidden="true" className="size-4" />}
      aria-label="Open command palette"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={open}
      className={["max-sm:w-(--control-h) max-sm:justify-center max-sm:px-0", className].filter(Boolean).join(" ")}
    >
      <span className="max-sm:hidden">Search</span>
      <Kbd shortcut="mod+k" className="max-sm:hidden" />
    </Button>
  );
}
