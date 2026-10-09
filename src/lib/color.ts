/** Colour conversions for `ColorPicker`: hex strings, RGB in 0 to 255 and HSV (hue 0 to 360, saturation and value 0 to 1). */

export type Rgb = readonly [r: number, g: number, b: number];
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const byte = (n: number) => clamp(Math.round(n), 0, 255);

/** `#rgb`, `#rrggbb` or the same without the `#` (any case) to RGB; `null` when it is not a colour. */
export function hexToRgb(hex: string): Rgb | null {
  const t = hex.trim().replace(/^#/, "");
  const full = t.length === 3 ? [...t].map((c) => c + c).join("") : t;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** RGB (each 0 to 255, rounded and clamped) to a lower-case `#rrggbb`. */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => byte(c).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsv([r, g, b]: Rgb): Hsv {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [byte((r + m) * 255), byte((g + m) * 255), byte((b + m) * 255)];
}

export const hsvToHex = (hsv: Hsv): string => rgbToHex(...hsvToRgb(hsv));
