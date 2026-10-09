import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Color",
  group: "Foundations",
  description:
    "The semantic colour tokens in the current scheme. Ground is pure black (dark) or pure white (light); neutrals are zero-chroma grays; colour appears only as state: red (danger), amber (warning), emerald (ok), sky (link), violet (agent). Components name these tokens, never a palette step or a literal. Below the roles: the direct colours (every hue in OKLCH from 50 to 950 plus one pure gray ramp), which name a colour and not a purpose, and the semantic ramps the package itself defines.",
  aliases: ["colour", "colors", "theme", "tokens", "semantic colors", "dark mode", "light mode", "palette roles", "colour palette", "hues", "swatches", "ramps", "oklch", "tailwind colors", "shades"],
} satisfies StoryDefault;

const SURFACES = ["ground", "surface", "surface-raised", "line", "line-strong"] as const;
const INK = ["ink", "ink-muted", "ink-faint"] as const;
const STATES = ["danger", "warning", "ok", "link", "agent"] as const;
const VARIANTS = ["", "-hover", "-soft", "-line"] as const;

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex w-36 flex-col gap-1">
      <div className="h-7 rounded border border-line" style={{ background: `var(--color-${token})` }} />
      <span className="text-ink">{token}</span>
    </div>
  );
}

export const Neutrals = () => (
  <div className="flex flex-wrap gap-3">
    {SURFACES.map((t) => (
      <Swatch key={t} token={t} />
    ))}
  </div>
);
Neutrals.storyMeta = { description: "Ground, surfaces and lines." };

export const Ink = () => (
  <div className="flex flex-col gap-1">
    {INK.map((t) => (
      <span key={t} style={{ color: `var(--color-${t})` }}>
        {t}: the quick brown fox jumps over the lazy dog
      </span>
    ))}
  </div>
);
Ink.storyMeta = { description: "Text colours, strongest to faintest." };

export const State = () => (
  <div className="flex flex-col gap-3">
    {STATES.map((s) => (
      <div key={s} className="flex flex-wrap gap-3">
        {VARIANTS.map((v) => (
          <Swatch key={v} token={`${s}${v}`} />
        ))}
      </div>
    ))}
  </div>
);
State.storyMeta = { description: "Each state colour with its hover, soft and line variants." };

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
