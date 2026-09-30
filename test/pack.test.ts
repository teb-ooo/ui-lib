import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { root } from "./root";

function storySources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? storySources(p) : p.endsWith(".stories.tsx") ? [p] : [];
  });
}

describe("packed tarball", () => {
  // --ignore-scripts: dist/ and stories/ are built by `npm run build` (prepack) before this runs in CI/release.
  const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8" });
  const files: string[] = (JSON.parse(out)[0].files as { path: string }[]).map((f) => f.path);

  it("ships every story file and the story format doc", () => {
    const expected = storySources(join(root, "src")).map((p) => "stories/" + p.slice(join(root, "src").length + 1));
    expect(expected.length).toBeGreaterThan(10);
    for (const f of expected) expect(files).toContain(f);
    expect(files).toContain("docs/stories.md");
    expect(files).toContain("theme.css");
  });

  it("does not ship test files, sources or node_modules", () => {
    expect(files.filter((f) => /(^|\/)node_modules\//.test(f) || /\.test\.tsx?$/.test(f) || f.startsWith("test/") || f.startsWith("src/"))).toEqual([]);
  });

  it("story files import only the public entry points", () => {
    for (const f of files.filter((f) => f.endsWith(".stories.tsx"))) {
      expect(readFileSync(join(root, f), "utf8"), f).not.toMatch(/from\s+"\.{1,2}\//);
    }
  });
});
