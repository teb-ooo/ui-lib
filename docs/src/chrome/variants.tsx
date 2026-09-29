import { Badge } from "@teb-ooo/ui";
import type { Entry } from "../registry";

export type PreviewTheme = "system" | "light" | "dark";

/** Every variant of an entry, side by side, on the neutral or surface backdrop, in the chosen theme. */
export function Variants({ entry, theme }: { entry: Entry; theme: PreviewTheme }) {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4"
      data-theme={theme === "system" ? undefined : theme}
      data-testid="variants"
    >
      {entry.variants.map(({ name, label, Component, meta }) => (
        <figure
          key={name}
          id={name}
          className={`m-0 flex flex-col gap-3 rounded-ctl border border-line p-4 text-ink ${
            meta.background === "surface" ? "bg-surface" : "bg-ground"
          }`}
        >
          <figcaption className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="text-ink">{label}</span>
            {meta.state ? <Badge>{meta.state}</Badge> : null}
          </figcaption>
          <div className="flex min-h-10 flex-wrap items-center gap-3">
            <Component />
          </div>
          {meta.description ? <p className="m-0 text-sm text-muted">{meta.description}</p> : null}
        </figure>
      ))}
    </div>
  );
}
