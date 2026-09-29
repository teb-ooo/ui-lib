import { parse, formatHex, converter } from "culori";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

type State = "danger" | "warning" | "ok" | "link" | "agent";
export type TokenName =
  | "ground"
  | "surface"
  | "surface-raised"
  | "line"
  | "line-strong"
  | "ink"
  | "ink-muted"
  | "ink-faint"
  | State
  | `${State}-${"hover" | "soft" | "line"}`;
export type Palette = Record<TokenName, string>;

const STATES: readonly State[] = ["danger", "warning", "ok", "link", "agent"];
export const COLOR_TOKENS: readonly TokenName[] = [
  "ground",
  "surface",
  "surface-raised",
  "line",
  "line-strong",
  "ink",
  "ink-muted",
  "ink-faint",
  ...STATES.flatMap((s): TokenName[] => [s, `${s}-hover`, `${s}-soft`, `${s}-line`]),
];
export type Theme = "dark" | "light";

/** Text tokens that must reach AA against ground and surface. */
export const TEXT_TOKENS = ["ink", "ink-muted", "ink-faint", "danger", "warning", "ok", "link", "agent"] as const satisfies readonly TokenName[];

const require = createRequire(import.meta.url);
const tailwindTheme = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");

/** Body of the first `{...}` block that follows `opener` in `css`. */
function blockAfter(css: string, opener: RegExp): string {
  const m = opener.exec(css);
  if (!m) throw new Error(`theme.css: block not found: ${opener}`);
  const start = css.indexOf("{", m.index) + 1;
  let depth = 1;
  let i = start;
  while (depth > 0 && i < css.length) {
    const ch = css[i++];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return css.slice(start, i - 1);
}

export function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1] ?? ""] = (m[2] ?? "").trim();
  return out;
}

export interface ThemeBlocks {
  /** `@theme static` colour declarations, emitted at :root: the dark default. */
  dark: Record<string, string>;
  /** `[data-theme="dark"]`: the dark set again, for forced containers. */
  darkScoped: Record<string, string>;
  /** Inside `@media (prefers-color-scheme: light)`. */
  lightMedia: Record<string, string>;
  /** `[data-theme="light"]`. */
  light: Record<string, string>;
}

export function readThemeBlocks(cssPath: string): ThemeBlocks {
  const css = readFileSync(cssPath, "utf8");
  const media = blockAfter(css, /@media \(prefers-color-scheme: light\)/);
  return {
    dark: declarations(blockAfter(css, /@theme static \{\s*--color-ground/)),
    darkScoped: declarations(blockAfter(css, /^\[data-theme="dark"\]/m)),
    lightMedia: declarations(blockAfter(media, /:root:not\(\[data-theme="dark"\]\)/)),
    light: declarations(blockAfter(css, /^\[data-theme="light"\]/m)),
  };
}

function resolveValue(raw: string): string {
  const v = raw.trim();
  const ref = /^var\((--[\w-]+)\)$/.exec(v);
  if (!ref) return v;
  const name = ref[1] ?? "";
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(tailwindTheme);
  if (!m) throw new Error(`theme.css references unknown palette variable ${name}`);
  return resolveValue(m[1] ?? "");
}

export function toHex(value: string): string {
  const resolved = resolveValue(value);
  const c = parse(resolved);
  if (!c) throw new Error(`cannot parse ${resolved}`);
  return formatHex(c); // clamps to sRGB
}

/** Literal hex for every colour token of one theme. */
export function hexPalette(decls: Record<string, string>): Palette {
  const out: Partial<Palette> = {};
  for (const n of COLOR_TOKENS) {
    const v = decls[`--color-${n}`];
    if (v === undefined) throw new Error(`token --color-${n} missing`);
    out[n] = toHex(v);
  }
  return out as Palette;
}

const rgb = converter("rgb");

function channel(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const c = rgb(parse(hex));
  if (!c) throw new Error(`cannot parse ${hex}`);
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG 2.x contrast ratio between two colours. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A `--text-*` size token in px, reading rem as 16px. */
export function textSizePx(css: string, name: "body" | "display"): { size: string; lineHeight: string } {
  const size = new RegExp(`--text-${name}:\\s*([\\d.]+)rem;`).exec(css)?.[1];
  const lh = new RegExp(`--text-${name}--line-height:\\s*([\\d.]+);`).exec(css)?.[1];
  if (!size || !lh) throw new Error(`--text-${name} not found in theme.css`);
  return { size: `${Number(size) * 16}px`, lineHeight: lh };
}

/** The one heavier weight, declared inside the `.display-lg` rule. */
export function displayWeight(css: string): string {
  const w = /^\.display-lg,[\s\S]*?font-weight:\s*(\d+);/m.exec(css)?.[1];
  if (!w) throw new Error("theme.css: .display-lg font-weight not found");
  return w;
}
