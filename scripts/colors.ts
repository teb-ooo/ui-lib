import { parse, formatHex, converter } from "culori";
import { readFileSync } from "node:fs";

export const TOKEN_NAMES = ["ground", "surface", "ink", "muted", "line", "accent", "on-accent", "danger"] as const;
export type TokenName = (typeof TOKEN_NAMES)[number];
export type Palette = Record<TokenName, string>;

function extract(block: string): Palette {
  const out: Partial<Palette> = {};
  for (const name of TOKEN_NAMES) {
    const m = new RegExp(`--${name}:\\s*(oklch\\([^)]*\\))\\s*;`).exec(block);
    if (!m?.[1]) throw new Error(`token --${name} missing in block`);
    out[name] = m[1];
  }
  return out as Palette;
}

/** Reads the OKLCH values of both themes from theme.css. */
export function readThemeOklch(cssPath: string): { light: Palette; dark: Palette } {
  const css = readFileSync(cssPath, "utf8");
  const light = /:root\s*\{([^}]*)\}/.exec(css)?.[1];
  const dark = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1];
  if (!light || !dark) throw new Error("theme.css: light or dark block not found");
  return { light: extract(light), dark: extract(dark) };
}

export function toHex(oklch: string): string {
  const c = parse(oklch);
  if (!c) throw new Error(`cannot parse ${oklch}`);
  // formatHex clamps to sRGB gamut.
  return formatHex(c);
}

export function hexPalette(p: Palette): Palette {
  const out: Partial<Palette> = {};
  for (const n of TOKEN_NAMES) out[n] = toHex(p[n]);
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

/** WCAG 2.x contrast ratio between two colours, computed on the gamut-clamped sRGB hex values. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
