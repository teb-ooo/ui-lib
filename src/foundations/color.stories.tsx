import { useEffect, useState } from "react";
import type { StoryDefault } from "../stories";

export default {
  title: "Color tokens",
  group: "Foundations",
  description: "The colour tokens as live custom properties. Toggle the theme to see both sets.",
} satisfies StoryDefault;

const TOKENS = ["ground", "surface", "ink", "muted", "line", "accent", "on-accent", "danger"] as const;

function Swatch({ token }: { token: (typeof TOKENS)[number] }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const read = () => setValue(getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim());
    read();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", read);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq?.removeEventListener?.("change", read);
      obs.disconnect();
    };
  }, [token]);
  return (
    <div className="flex w-40 flex-col gap-1 text-sm">
      <div className="h-12 rounded-ctl border border-line" style={{ background: `var(--${token})` }} />
      <span className="text-ink">{token}</span>
      <span className="text-muted">{value}</span>
    </div>
  );
}

export const Tokens = () => (
  <div className="flex flex-wrap gap-4">
    {TOKENS.map((t) => (
      <Swatch key={t} token={t} />
    ))}
  </div>
);
Tokens.storyMeta = { description: "Every token with its current OKLCH value." };
