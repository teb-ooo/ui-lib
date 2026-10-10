import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "src");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : n.endsWith(".tsx") && !n.endsWith(".test.tsx") && !n.endsWith(".stories.tsx") ? [join(dir, n)] : []));

describe("focus ring", () => {
  // `outline-none` sets the outline style to none; `focus-visible:outline` alone then draws a ring of style none (nothing). The
  // ring needs `focus-visible:outline-solid` next to it, or a keyboard user sees no focus (it was so for Checkbox and Switch).
  it("every control that draws its focus ring with an outline sets its style to solid", () => {
    const missing: string[] = [];
    for (const file of walk(root)) {
      const code = readFileSync(file, "utf8");
      for (const line of code.split("\n")) {
        if (/focus-visible:outline(?![-\w])/.test(line) && !/focus-visible:outline-solid/.test(line) && !/outline-(solid|dashed)/.test(line)) missing.push(`${file.slice(root.length + 1)}: ${line.trim().slice(0, 90)}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
