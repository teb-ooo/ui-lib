import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { root } from "./root";
import { contrast, hexPalette, readThemeOklch } from "../scripts/colors.ts";
import type { Palette } from "../scripts/colors.ts";

const themes = readThemeOklch(join(root, "theme.css"));
const AA_TEXT = 4.5;

const cases: ReadonlyArray<[string, keyof Palette, keyof Palette]> = [
  ["body text on ground", "ink", "ground"],
  ["body text on surface", "ink", "surface"],
  ["muted text on ground", "muted", "ground"],
  ["muted text on surface", "muted", "surface"],
  ["accent text on ground", "accent", "ground"],
  ["accent text on surface", "accent", "surface"],
  ["danger text on ground", "danger", "ground"],
  ["danger text on surface", "danger", "surface"],
  ["solid button label on accent", "on-accent", "accent"],
];

describe.each(["light", "dark"] as const)("WCAG AA contrast, %s theme", (mode) => {
  const p = hexPalette(themes[mode]);
  it.each(cases)("%s >= 4.5:1", (_label, fg, bg) => {
    const ratio = contrast(p[fg], p[bg]);
    expect(ratio, `${fg} ${p[fg]} on ${bg} ${p[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA_TEXT);
  });
  it("line is visible against ground (non-text 1.3:1 floor)", () => {
    expect(contrast(p.line, p.ground)).toBeGreaterThanOrEqual(1.3);
  });
});

describe("contrast helper", () => {
  it("black on white is 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});
