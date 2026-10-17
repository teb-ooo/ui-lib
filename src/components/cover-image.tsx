import { useState } from "react";
import type { ReactNode } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface CoverImageProps {
  /** The picture's address, or none: then a quiet "Add cover" row (when `onAdd` is given) or nothing. */
  src?: string | null;
  /** What the picture shows ("" for a decorative one). */
  alt: string;
  /**
   * Buttons for the cover (Change cover, Generate, Remove): drawn over the picture's top right, shown while the pointer is over
   * the banner or focus is inside it, and always on a touch screen.
   */
  actions?: ReactNode;
  /** Called by the quiet "Add cover" row shown while there is no `src`. Without it nothing is drawn for no cover. */
  onAdd?: () => void;
  /** Label of that row. @default "Add cover" */
  addLabel?: string;
  /** Height of the banner: `compact` is 12rem, `tall` is 16rem. It is 10rem on a phone either way. @default "tall" */
  size?: "compact" | "tall";
  className?: string;
}

/**
 * A banner picture at the top of a page, edge to edge of its container (put it outside the page's `Container`, like a
 * `PageHeader` band): the picture is cropped to a fixed height with its middle kept, fades in when loaded, and draws nothing
 * if it cannot be loaded (not a broken-image icon). Its `actions` appear on hover or focus, and always on a touch screen.
 */
export function CoverImage({ src, alt, actions, onAdd, addLabel = "Add cover", size = "tall", className }: CoverImageProps) {
  const [state, setState] = useState<{ src: string; status: "loading" | "done" | "failed" } | null>(null);
  if (!src) {
    if (!onAdd) return null;
    return (
      <div className={cn("px-4 md:px-6", className)}>
        <Button icon={<ImagePlus aria-hidden="true" className="size-4" />} onClick={onAdd} className="border-transparent text-ink-faint">
          {addLabel}
        </Button>
      </div>
    );
  }
  const status = state?.src === src ? state.status : "loading";
  if (status === "failed") return null;
  return (
    <figure
      data-cover=""
      className={cn(
        "group relative w-full overflow-hidden border-b border-line bg-surface",
        size === "compact" ? "h-40 sm:h-48" : "h-40 sm:h-64",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setState({ src, status: "done" })}
        onError={() => setState({ src, status: "failed" })}
        className={cn("block size-full object-cover transition-opacity duration-150", status === "done" ? "opacity-100" : "opacity-0")}
      />
      {actions ? (
        <div className="panel absolute top-2 right-2 flex flex-wrap items-center justify-end gap-1 p-1 opacity-0 transition-opacity duration-100 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 max-sm:opacity-100">
          {actions}
        </div>
      ) : null}
    </figure>
  );
}
