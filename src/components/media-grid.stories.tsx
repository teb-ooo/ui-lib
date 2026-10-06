import { useState } from "react";
import { MediaGrid } from "./media-grid";
import type { MediaItem } from "./media-grid";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "MediaGrid",
  group: "Molecules",
  description:
    "A browser for pictures and other media: square-cropped thumbnails in a grid with as many columns as fit, a corner badge for audio and video with its length, a caption, lazy images that fade in over a placeholder, and paging for a long list (Load more, or by itself when the end scrolls into view). Arrow keys, Home and End move between tiles like CardGrid; Enter opens one. Thousands of tiles stay cheap because tiles off screen are not laid out.",
  aliases: ["thumbnails", "photo grid", "gallery", "media browser", "image grid", "contact sheet", "photos", "thumbnail grid", "media tiles"],
  component: "MediaGrid",
  source: "src/components/media-grid.tsx",
} satisfies StoryDefault;

// Stand-ins for photographs: their colours are picture content, not interface colours.
const PAINTS = [
  ["steelblue", "lightskyblue"],
  ["chocolate", "peachpuff"],
  ["seagreen", "palegreen"],
  ["slateblue", "plum"],
  ["goldenrod", "khaki"],
  ["crimson", "pink"],
  ["teal", "paleturquoise"],
  ["olivedrab", "yellowgreen"],
];
/** A square picture drawn in place, so the examples need no network. */
function thumb(n: number): string {
  const [ground, shape] = PAINTS[n % PAINTS.length] as [string, string];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${ground}"/><circle cx="${60 + (n % 5) * 20}" cy="${70 + (n % 3) * 20}" r="${30 + (n % 4) * 10}" fill="${shape}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const senders = ["alex", "sam", "kim", "robin"];
function make(from: number, count: number): MediaItem[] {
  return Array.from({ length: count }, (_, i) => {
    const n = from + i;
    const kind = n % 7 === 3 ? "video" : n % 7 === 5 ? "audio" : "image";
    return {
      id: `m${n}`,
      src: thumb(n),
      kind,
      ...(kind === "image" ? {} : { duration: 8 + ((n * 13) % 170) }),
      caption: senders[n % senders.length],
      alt: `Item ${n + 1} from ${senders[n % senders.length]}`,
    } satisfies MediaItem;
  });
}

export const Browse = () => {
  const [open, setOpen] = useState<string | undefined>();
  return (
    <div className="flex flex-col gap-2">
      <MediaGrid label="Photos in this thread" items={make(0, 24)} activeId={open} onOpen={(item) => setOpen(item.id)} />
      <p className="text-ink-muted">{open ? `Open: ${open}` : "Nothing open."}</p>
    </div>
  );
};
Browse.storyMeta = { description: "Click or press Enter on a tile to open it; the open one is marked. Video and audio carry their length." } satisfies StoryMeta;

export const LoadMore = () => {
  const [items, setItems] = useState(() => make(0, 24));
  const [loading, setLoading] = useState(false);
  const total = 120;
  const more = () => {
    setLoading(true);
    setTimeout(() => {
      setItems((prev) => [...prev, ...make(prev.length, 24)]);
      setLoading(false);
    }, 500);
  };
  return <MediaGrid label="Photos in this thread" items={items} total={total} hasMore={items.length < total} loading={loading} onLoadMore={more} autoLoad={false} />;
};
LoadMore.storyMeta = { description: "A cursor-paged list: append each page to the items. Load more fetches the next page; the count says how many of all are shown. In an app leave autoLoad on, so scrolling to the end loads the next page." } satisfies StoryMeta;

export const Dense = () => <MediaGrid label="Contact sheet" items={make(0, 60)} minTileWidth={4.5} />;
Dense.storyMeta = { description: "A smaller minTileWidth is a contact sheet; a density switch just changes it." } satisfies StoryMeta;

export const Broken = () => <MediaGrid label="Missing pictures" items={[{ id: "a", src: "data:image/png;base64,broken", caption: "alex", alt: "Lost photo" }, ...make(1, 3)]} />;
Broken.storyMeta = { description: "A picture that does not load leaves a quiet placeholder, not a broken-image icon." } satisfies StoryMeta;

export const Empty = () => <MediaGrid label="Photos" items={[]} empty={<p className="p-4 text-ink-muted">No photos in this thread yet.</p>} />;
Empty.storyMeta = { description: "No items and nothing loading: the empty message." } satisfies StoryMeta;
