import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

// What a phone needs that no jsdom test can see; these keep the rules from being deleted by accident (the browser behaviour is
// checked in the gallery's e2e).
describe("mobile rules", () => {
  it("a pressed control is one height at every width: --target-h has no phone or touch override (owner decision)", () => {
    const css = read("theme.css");
    expect(css).toMatch(/--target-h:\s*1\.75rem;/);
    expect(css.match(/--target-h:/g)).toHaveLength(1);
  });
  it("a checkbox is --target-h square, drawn by the variable and not by a fixed size", () => {
    const c = read("src/components/checkbox.tsx");
    expect(c).toContain("size-[var(--target-h)]");
    expect(c).not.toContain("before:-inset-3.5");
  });
  it("surfaces at the bottom edge leave room for the home indicator (zero unless the page sets viewport-fit=cover)", () => {
    for (const f of ["src/components/toast.tsx", "src/components/modal.tsx", "src/components/shell.tsx"]) expect(read(f), f).toContain("env(safe-area-inset-bottom)");
  });
  it("modal and drawer scrollers do not chain their scroll to the page behind them", () => {
    for (const f of ["src/components/modal.tsx", "src/components/sidebar.tsx", "src/components/select.tsx", "src/components/combobox.tsx", "src/components/shell.tsx"]) {
      expect(read(f), f).toContain("overscroll-contain");
    }
  });
});

describe("switch", () => {
  it("is --target-h tall, its thumb and travel following the variable", () => {
    const c = read("src/components/switch.tsx");
    expect(c).toContain("h-[var(--target-h)]");
    expect(c).toContain("var(--target-h)*0.8");
    expect(c).not.toContain("h-5 w-9");
  });
});

describe("zoom", () => {
  it("the theme turns off double-tap zoom on the page", () => {
    const css = read("theme.css");
    expect(css).toMatch(/html\s*{[^}]*touch-action:\s*manipulation/);
  });
});

describe("the shell", () => {
  it("contains what is drawn inside it, so a fixed element in the page cannot make the document scroll", () => {
    expect(read("src/components/shell.tsx")).toMatch(/h-dvh[^"]*contain-paint/);
  });
});

describe("one control height", () => {
  it("no component hard-codes the 28px control height: they read --control-h or --target-h", () => {
    const dir = join(import.meta.dirname, "..", "src", "components");
    const offenders: string[] = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".tsx") || f.includes(".test.") || f.includes(".stories.")) continue;
      const text = readFileSync(join(dir, f), "utf8");
      text.split("\n").forEach((line, i) => {
        if (/(^|[^-\w])(?:min-)?(?:h|size|w)-7\b|\bh-\[1\.75rem\]|\bh-\[28px\]|\bsize-\[28px\]/u.test(line)) offenders.push(`${f}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
