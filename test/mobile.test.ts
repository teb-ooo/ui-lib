import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

// What a phone needs that no jsdom test can see; these keep the rules from being deleted by accident (the browser behaviour is
// checked in the gallery's e2e).
describe("mobile rules", () => {
  it("touch targets are 44px for a phone width or a finger as the main pointer, not width alone", () => {
    expect(read("theme.css")).toMatch(/@media \(max-width: 40rem\), \(pointer: coarse\) \{\s*:root \{\s*--target-h: 2\.75rem;/);
  });
  it("a checkbox has an invisible 44px target where a finger taps, and keeps its 16px look", () => {
    const c = read("src/components/checkbox.tsx");
    expect(c).toContain("before:-inset-3.5");
    expect(c).toContain("pointer-coarse:before:block");
    expect(c).toContain("size-4");
  });
  it("surfaces at the bottom edge leave room for the home indicator (zero unless the page sets viewport-fit=cover)", () => {
    for (const f of ["src/components/toast.tsx", "src/components/sheet.tsx", "src/components/shell.tsx"]) expect(read(f), f).toContain("env(safe-area-inset-bottom)");
  });
  it("modal and drawer scrollers do not chain their scroll to the page behind them", () => {
    for (const f of ["src/components/dialog.tsx", "src/components/sheet.tsx", "src/components/sidebar.tsx", "src/components/select.tsx", "src/components/combobox.tsx", "src/components/shell.tsx"]) {
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
