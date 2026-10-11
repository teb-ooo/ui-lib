import { readFileSync } from "node:fs";
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
  it("a checkbox has an invisible 44px target where a finger taps, and keeps its 16px look", () => {
    const c = read("src/components/checkbox.tsx");
    expect(c).toContain("before:-inset-3.5");
    expect(c).toContain("pointer-coarse:before:block");
    expect(c).toContain("size-4");
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
