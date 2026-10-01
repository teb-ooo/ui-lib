import type { StoryDefault } from "../stories";

export default {
  title: "Color tokens",
  group: "Foundations",
  description:
    "The semantic colour tokens in the current scheme. Ground is pure black (dark) or pure white (light); neutrals are zero-chroma grays; colour appears only as state: red (danger), amber (warning), emerald (ok), sky (link), violet (agent). Components name these tokens, never a palette step or a literal.",
  aliases: ["colour", "colors", "theme", "tokens", "semantic colors", "dark mode", "light mode", "palette roles"],
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
