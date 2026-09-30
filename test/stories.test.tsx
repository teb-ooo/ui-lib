import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { root } from "./root";
import type { StoryDefault } from "../src/stories";

const modules = import.meta.glob<Record<string, unknown>>("../src/**/*.stories.tsx", { eager: true });

/** Exports of src/index.ts that are not components and need no story. */
const NON_COMPONENT_ALLOWLIST = new Set(["initialsOf", "useMediaQuery", "useMinWidth", "BREAKPOINTS"]);
const GROUPS = new Set(["Foundations", "Atoms", "Molecules", "Email"]);

function valueExports(): Array<{ name: string; from: string }> {
  const src = readFileSync(join(root, "src/index.ts"), "utf8");
  const out: Array<{ name: string; from: string }> = [];
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}\s*from\s*"([^"]+)";?$/gm)) {
    for (const n of (m[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
      out.push({ name: n, from: m[2] ?? "" });
    }
  }
  return out;
}

describe("stories coverage", () => {
  const storyPaths = Object.keys(modules);

  it("finds story modules", () => {
    expect(storyPaths.length).toBeGreaterThan(0);
  });

  it("every exported component has a co-located story", () => {
    const exports = valueExports();
    expect(exports.length).toBeGreaterThan(0);
    for (const { name, from } of exports) {
      if (NON_COMPONENT_ALLOWLIST.has(name)) continue;
      const expected = `../src/${from.replace(/^\.\//, "")}.stories.tsx`;
      expect(storyPaths, `component ${name} (${from}) has no story at ${expected}`).toContain(expected);
    }
  });

  it("the allowlist only names real exports", () => {
    const names = valueExports().map((e) => e.name);
    for (const n of NON_COMPONENT_ALLOWLIST) expect(names).toContain(n);
  });
});

describe.each(Object.entries(modules))("story module %s", (path, mod) => {
  const def = mod["default"] as StoryDefault | undefined;

  it("has a complete default export", () => {
    expect(def, "missing default export").toBeDefined();
    expect(typeof def?.title).toBe("string");
    expect(def?.title.length).toBeGreaterThan(0);
    expect(GROUPS.has(def?.group ?? "")).toBe(true);
    expect(typeof def?.description).toBe("string");
    expect(def?.description.length).toBeGreaterThan(0);
    if (def?.component !== undefined) {
      expect(valueExports().map((e) => e.name), `${path}: component "${def.component}" is not exported`).toContain(def.component);
      expect(typeof def.source).toBe("string");
    }
  });

  const variants = Object.entries(mod).filter(([k]) => k !== "default");

  it("has at least one PascalCase variant that is a function component", () => {
    expect(variants.length).toBeGreaterThan(0);
    for (const [name, v] of variants) {
      expect(name, "variant names are PascalCase").toMatch(/^[A-Z][A-Za-z0-9]*$/);
      expect(typeof v).toBe("function");
    }
  });

  it.each(variants)("variant %s renders", (_name, v) => {
    const Variant = v as () => React.JSX.Element;
    const { container } = render(<Variant />);
    expect(container.innerHTML.length + document.body.innerHTML.length).toBeGreaterThan(0);
  });
});
