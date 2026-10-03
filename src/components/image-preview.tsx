import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../lib/cn";
import { LinkButton } from "./link-button";

export interface ImagePreviewProps {
  src: string;
  /** What the picture shows. Required: an image without a description is a gap for screen readers. */
  alt: string;
  /** Tallest the picture gets, in rem; it keeps its proportions. @default 20 */
  maxHeight?: number;
  /** Adds a link under the picture that opens it at full size in a new tab. */
  href?: string;
  /** Label of that link. @default "Open full size" */
  openLabel?: string;
  className?: string;
}

/**
 * A picture (a screenshot, an avatar sheet) in the panel look: a border, a max height, its proportions kept and an optional
 * "Open full size" link. If the picture fails to load nothing is drawn, not a broken-image icon.
 */
export function ImagePreview({ src, alt, maxHeight = 20, href, openLabel = "Open full size", className }: ImagePreviewProps) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return null;
  return (
    <figure className={cn("flex flex-col items-start gap-2", className)}>
      <div className="panel overflow-hidden">
        <img src={src} alt={alt} onError={() => setFailed(src)} style={{ maxHeight: `${maxHeight}rem` }} className="block h-auto max-w-full object-contain" />
      </div>
      {href ? (
        <LinkButton href={href} target="_blank" rel="noreferrer" icon={<ExternalLink className="size-4" aria-hidden="true" />}>
          {openLabel}
        </LinkButton>
      ) : null}
    </figure>
  );
}
