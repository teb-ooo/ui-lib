import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";
import { describe, expect, it } from "vitest";
import { root } from "./root";

const css = readFileSync(join(root, "theme.css"), "utf8");
const start = css.indexOf("@layer utilities {\n  /* REVERSAL depth 1");
const end = css.indexOf("  /* A tinted button fills with its tone when hovered. */");
const inner = css.slice(start + "@layer utilities {\n".length, end);
const block = `@layer utilities {\n${inner}}\n`;

// The CSS tooling of an app flattens nested rules: a nested rule whose selector is a list of six, six levels deep, became
// every combination of its parents (6 to the power of 6) and every page of every app downloaded 4 MB of it (ui 0.84.0
// to 0.87.1). The reversal levels are therefore written flat, and this builds them the way an app's Vite does and
// refuses a result that is more than a few times what was written.
describe("the reversal block of theme.css, as an app's build turns it into CSS", () => {
  it("is written flat: no rule is nested inside another", () => {
    expect(inner).not.toMatch(/\{[^{}]*\{/u);
  });
  it("stays small once built for the browsers an app targets", () => {
    for (const targets of [
      { chrome: 107 << 16, edge: 107 << 16, firefox: 104 << 16, safari: 16 << 16 },
      { chrome: 87 << 16, firefox: 78 << 16, safari: 14 << 16 }, // older browsers, which cannot be left to :is() and :not() lists
    ]) {
      const out = transform({ filename: "reversal.css", code: Buffer.from(block), minify: true, targets }).code.length;
      expect(out, `${out} bytes built from ${block.length} written`).toBeLessThan(block.length * 4);
    }
  });
});
