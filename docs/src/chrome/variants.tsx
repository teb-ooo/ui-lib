import { Chip } from "@teb-ooo/ui";
import type { Entry } from "../registry";

/** Every variant of an entry, side by side, rendered in the page itself so it follows the page theme. */
export function Variants({ entry }: { entry: Entry }) {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4"
      data-testid="variants"
    >
      {entry.variants.map(({ name, label, Component, meta }) => (
        <figure
          key={name}
          id={name}
          className={`m-0 flex flex-col gap-3 rounded border border-line p-4 text-ink ${
            meta.background === "surface" ? "bg-surface" : "bg-ground"
          }`}
        >
          <figcaption className="flex flex-wrap items-center gap-2 text-ink-muted">
            <span className="text-ink">{label}</span>
            {meta.state ? <Chip tone="muted">{meta.state}</Chip> : null}
          </figcaption>
          <div className="flex min-h-(--control-h) flex-wrap items-center gap-3">
            <Component />
          </div>
          {meta.description ? <p className="m-0 text-ink-muted">{meta.description}</p> : null}
        </figure>
      ))}
    </div>
  );
}
