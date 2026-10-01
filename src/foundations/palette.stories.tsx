import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Palette",
  group: "Foundations",
  description:
    "Direct colours: every hue in OKLCH from 50 to 950, plus one pure gray ramp (neutral). They name a colour, not a purpose. Apps do not use them in components; an app points its semantic colours (danger, link, ...) at them in one place. Below them, the semantic ramps the package itself defines.",
  aliases: ["colour palette", "colors", "hues", "swatches", "ramps", "oklch", "tailwind colors", "shades"],
} satisfies StoryDefault;

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const HUES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "neutral",
] as const;
const SEMANTIC = ["danger", "warning", "ok", "link", "agent", "gray"] as const;

function Ramp({ name, steps = STEPS }: { name: string; steps?: readonly number[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-ink-muted">{name}</span>
      <div className="flex">
        {steps.map((n) => (
          <div key={n} className="flex min-w-0 flex-1 flex-col gap-1">
            <div
              className="h-7 border-y border-line first:rounded-l first:border-l last:rounded-r last:border-r"
              style={{ background: `var(--color-${name}-${n})` }}
            />
            <span className="truncate text-center text-ink-faint">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Direct = () => (
  <div className="flex flex-col gap-4">
    {HUES.map((h) => (
      <Ramp key={h} name={h} />
    ))}
  </div>
);
Direct.storyMeta = {
  description: "Seventeen hues and the neutral gray, 50 (lightest) to 950 (darkest). Use as --color-<hue>-<step>.",
} satisfies StoryMeta;

export const Semantic = () => (
  <div className="flex flex-col gap-4">
    {SEMANTIC.map((s) => (
      <Ramp key={s} name={s} />
    ))}
  </div>
);
Semantic.storyMeta = {
  description: "What the package's components use: each ramp points at a direct colour. Repoint one in your own CSS and every component follows.",
} satisfies StoryMeta;
