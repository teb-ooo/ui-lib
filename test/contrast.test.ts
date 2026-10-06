import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./root";
import { COLOR_TOKENS, TEXT_TOKENS, contrast, hexPalette, readThemeBlocks } from "../scripts/colors.ts";

const blocks = readThemeBlocks(join(root, "theme.css"));
const AA_TEXT = 4.5;

describe("theme blocks", () => {
  it("the forced-dark container repeats the dark set exactly", () => {
    expect(blocks.darkScoped).toMatchObject(pick(blocks.dark));
  });
  it("the OS-light block repeats the explicit light set exactly", () => {
    expect(blocks.lightMedia).toMatchObject(pick(blocks.light));
  });
  it("defines every token in both themes", () => {
    for (const set of [blocks.dark, blocks.light]) {
      for (const n of COLOR_TOKENS) expect(set[`--color-${n}`], `--color-${n}`).toBeDefined();
    }
  });
  it("ground is exactly black in dark and white in light", () => {
    expect(blocks.dark["--color-ground"]?.toLowerCase()).toBe("#000000");
    expect(blocks.light["--color-ground"]?.toLowerCase()).toBe("#ffffff");
  });
  it("neutral tokens have zero chroma", () => {
    for (const set of [blocks.dark, blocks.light]) {
      const p = hexPalette(set);
      for (const n of ["ground", "surface", "surface-raised", "line", "line-strong", "ink", "ink-muted", "ink-faint"] as const) {
        const h = p[n].slice(1);
        expect(h.slice(0, 2), n).toBe(h.slice(2, 4));
        expect(h.slice(2, 4), n).toBe(h.slice(4, 6));
      }
    }
  });
});

function pick(d: Record<string, string>): Record<string, string> {
  return Object.fromEntries(COLOR_TOKENS.map((n) => [`--color-${n}`, d[`--color-${n}`] ?? ""]));
}

describe.each([
  ["dark", blocks.dark],
  ["light", blocks.light],
] as const)("WCAG AA contrast, %s theme", (_mode, decls) => {
  const p = hexPalette(decls);
  const cases = TEXT_TOKENS.flatMap((fg) => (["ground", "surface"] as const).map((bg) => [fg, bg] as const));
  it.each(cases)("%s on %s >= 4.5:1", (fg, bg) => {
    const ratio = contrast(p[fg], p[bg]);
    expect(ratio, `${fg} ${p[fg]} on ${bg} ${p[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA_TEXT);
  });
  it("muted text also reads on the raised surface", () => {
    expect(contrast(p["ink-muted"], p["surface-raised"])).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(p["ink"], p["surface-raised"])).toBeGreaterThanOrEqual(AA_TEXT);
  });
  it("hover text colours also read on ground", () => {
    for (const s of ["danger", "warning", "ok", "link", "agent"] as const) {
      expect(contrast(p[`${s}-hover`], p.ground), `${s}-hover`).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
  it("lines step away from the ground", () => {
    expect(contrast(p.line, p.ground)).toBeGreaterThanOrEqual(1.2);
    expect(contrast(p["line-strong"], p.ground)).toBeGreaterThanOrEqual(3);
  });
});

describe("the reversal token sets (REVERSAL in theme.css)", () => {
  const css = readFileSync(join(root, "theme.css"), "utf8");
  const layer = css.slice(css.indexOf("@layer utilities {"));
  const marks = [...layer.matchAll(/\/\* REVERSAL depth (\d): [^*]*\*\//g)];
  const section = (i: number) => layer.slice(marks[i]!.index!, marks[i + 1]?.index ?? layer.indexOf("/* A tinted button fills"));
  const decls = (text: string) => Object.fromEntries([...text.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1] ?? "", (m[2] ?? "").trim()]));
  // Odd depths are reversed (a light page gets the dark set's value), even depths restore the page's own tokens.
  const sets = [1, 2, 3, 4, 5, 6].map((depth) => [`depth ${depth} ${depth % 2 === 1 ? "is reversed" : "restores the page's own tokens"}`, depth - 1, depth % 2 === 1 ? blocks.dark : blocks.light, depth % 2 === 1 ? blocks.light : blocks.dark] as const);

  it("writes out six levels, in order", () => {
    expect(marks.map((m) => m[1])).toEqual(["1", "2", "3", "4", "5", "6"]);
  });
  it.each(sets)("%s: every colour token is light-dark(<for a light page>, <for a dark page>)", (_name, level, forLight, forDark) => {
    const d = decls(section(level));
    for (const n of COLOR_TOKENS) {
      const key = `--color-${n}`;
      expect(d[key], key).toBeDefined();
      const v = d[key] ?? "";
      const m = /^light-dark\((.+),\s*(.+)\)$/.exec(v);
      const [light, dark] = m ? [m[1]?.trim(), m[2]?.trim()] : [v, v];
      expect(light, `${key} in a light page`).toBe(forLight[key]);
      expect(dark, `${key} in a dark page`).toBe(forDark[key]);
    }
  });
});

describe("contrast helper", () => {
  it("black on white is 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});
