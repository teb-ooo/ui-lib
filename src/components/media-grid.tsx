import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Film, ImageOff, Music } from "lucide-react";
import { cn } from "../lib/cn";
import { moveFocusInGrid } from "../lib/grid-keys";
import { Button } from "./button";

export type MediaKind = "image" | "audio" | "video";

export interface MediaItem {
  /** Stable identity, also the key. */
  id: string;
  /** The thumbnail's address; it is cropped to a square. */
  src: string;
  /** What the picture shows, when that is known. Otherwise the caption (or "Image") names the tile. */
  alt?: string;
  /** Draws a badge in the corner: image, audio or video. */
  kind?: MediaKind;
  /** Length of an audio or video item, in seconds (shown as `0:12`) or as ready text. */
  duration?: number | string;
  /** A quiet line under the tile: a sender, a date. */
  caption?: ReactNode;
}

export interface MediaGridProps {
  /** Accessible name of the list: "Photos in this thread". */
  label: string;
  items: readonly MediaItem[];
  /** Called when a tile is clicked or opened with Enter or Space. */
  onOpen?: (item: MediaItem) => void;
  /** The item shown elsewhere right now (a preview pane): its tile is marked and `aria-current`. */
  activeId?: string;
  /** The narrowest a tile gets, in rem; columns are as many as fit. A smaller value is a denser contact sheet. @default 8 */
  minTileWidth?: number;
  /** More items exist after the last one (the list's `next_cursor` is set). */
  hasMore?: boolean;
  /** Fetches the next page. Called by the "Load more" button, and by scrolling to the end when `autoLoad` is on. */
  onLoadMore?: () => void;
  /** The next page is being fetched: the button waits and the list is `aria-busy`. @default false */
  loading?: boolean;
  /** Load the next page by itself when the end of the grid scrolls into view (the button stays as the way to ask by hand). @default true */
  autoLoad?: boolean;
  /** How many items exist in all, when the server knows: shown as "120 of 5,000". */
  total?: number;
  /** @default "Load more" */
  loadMoreLabel?: string;
  /** Shown when there are no items and none are loading. */
  empty?: ReactNode;
  className?: string;
}

const KIND_ICON = { image: null, audio: Music, video: Film } as const;
const KIND_NAME: Record<MediaKind, string> = { image: "Image", audio: "Audio", video: "Video" };

function clock(d: number | string): string {
  if (typeof d === "string") return d;
  const s = Math.max(0, Math.round(d));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Tile({ item, active, onOpen }: { item: MediaItem; active: boolean; onOpen: ((item: MediaItem) => void) | undefined }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  // An image that was already in the cache has finished before React attached `onLoad`.
  const attach = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);
  const Icon = item.kind ? KIND_ICON[item.kind] : null;
  const name = item.alt ?? (typeof item.caption === "string" ? item.caption : KIND_NAME[item.kind ?? "image"]);
  return (
    // content-visibility keeps thousands of tiles cheap: the browser skips layout and paint of the ones off screen.
    <div role="listitem" className="min-w-0 [contain-intrinsic-size:auto_12rem] [content-visibility:auto]">
      <button
        type="button"
        data-media-tile=""
        data-active={active ? "" : undefined}
        {...(active ? { "aria-current": "true" as const } : {})}
        aria-label={item.duration !== undefined ? `${name}, ${KIND_NAME[item.kind ?? "image"].toLowerCase()}, ${clock(item.duration)}` : name}
        onClick={() => onOpen?.(item)}
        className={cn(
          "relative block aspect-square w-full cursor-pointer overflow-hidden rounded border bg-surface-raised p-0 outline-none transition-colors duration-100 hover-invert focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-ink",
          active ? "border-ink" : "border-line",
        )}
      >
        {state === "error" ? (
          <span className="flex size-full items-center justify-center text-ink-faint">
            <ImageOff aria-hidden="true" className="size-6" />
          </span>
        ) : (
          <img
            ref={attach}
            src={item.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
            className={cn("size-full object-cover transition-opacity duration-150", state === "loaded" ? "opacity-100" : "opacity-0")}
          />
        )}
        {state === "loading" ? <span aria-hidden="true" className="anim-delayed absolute inset-0 bg-surface-raised" /> : null}
        {item.kind === "audio" || item.kind === "video" || item.duration !== undefined ? (
          <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-ground px-1 text-ink">
            {Icon ? <Icon aria-hidden="true" className="size-3" /> : null}
            {item.duration !== undefined ? <span>{clock(item.duration)}</span> : null}
          </span>
        ) : null}
      </button>
      {item.caption ? <p className="mt-1 truncate text-ink-muted">{item.caption}</p> : null}
    </div>
  );
}

/**
 * A browser for pictures and other media: square-cropped thumbnails in a grid with as many columns as fit, an optional
 * kind and length badge, a caption, lazy-loaded images that fade in over a placeholder, and paging for a long list
 * ("Load more", or by itself when the end scrolls into view). Tab reaches each tile; the arrow keys, Home and End move
 * between them like `CardGrid`, and Enter or Space opens one. Feed it a cursor-paged list (`useListTable`'s sibling for
 * grids is the same `next_cursor` loop) and append each page to `items`; thousands of tiles stay cheap because tiles off
 * screen are not laid out. For rows of text use `DataTable`; for summaries of things use `CardGrid`.
 */
export function MediaGrid({ label, items, onOpen, activeId, minTileWidth = 8, hasMore = false, onLoadMore, loading = false, autoLoad = true, total, loadMoreLabel = "Load more", empty, className }: MediaGridProps) {
  const root = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const ask = useRef(onLoadMore);
  useEffect(() => {
    ask.current = onLoadMore;
  });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => moveFocusInGrid(e, [...(root.current?.querySelectorAll<HTMLElement>("[data-media-tile]") ?? [])]);

  useEffect(() => {
    const node = end.current;
    if (!autoLoad || !hasMore || loading || !node || typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver((entries) => {
      if (entries.some((x) => x.isIntersecting)) ask.current?.();
    }, { rootMargin: "400px" });
    watcher.observe(node);
    return () => watcher.disconnect();
    // `items.length` re-arms the observer after a page arrives, so an end that is still in view loads the next one.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [autoLoad, hasMore, loading, items.length]);

  if (items.length === 0 && !loading && !hasMore) return <>{empty ?? null}</>;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow keys move focus between the tiles inside the list */}
      <div
        ref={root}
        role="list"
        aria-label={label}
        aria-busy={loading}
        onKeyDown={onKeyDown}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minTileWidth}rem), 1fr))` }}
      >
        {items.map((item) => (
          <Tile key={item.id} item={item} active={item.id === activeId} onOpen={onOpen} />
        ))}
      </div>
      {hasMore || total !== undefined ? (
        <div ref={end} className="flex flex-wrap items-center justify-center gap-3 text-ink-muted">
          {total !== undefined ? <span>{`${items.length.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`}</span> : null}
          {hasMore ? (
            <Button loading={loading} onClick={() => onLoadMore?.()}>
              {loadMoreLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
