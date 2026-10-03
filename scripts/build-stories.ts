// Copies src/**/*.stories.tsx to stories/** and rewrites their relative imports to the package's public
// entry points, so a consumer's Vite can glob node_modules/@teb-ooo/ui/stories/**/*.stories.tsx and render them.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "src");
const out = join(root, "stories");
const PKG = "@teb-ooo/ui";

/** `entry` is the public entry the story's sibling imports resolve to: the root, or `@teb-ooo/ui/cmdk` for stories under src/cmdk. */
export function rewrite(code: string, entry: string = PKG): string {
  return code
    .replace(/from\s+"\.\.\/stories"/g, `from "${PKG}/stories"`)
    .replace(/from\s+"\.\.\/\.\.\/email\/([^"]+)"/g, `from "${PKG}/email/$1"`)
    .replace(/from\s+"\.\/[^"]+"/g, `from "${entry}"`);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".stories.tsx") ? [p] : [];
  });
}

rmSync(out, { recursive: true, force: true });
for (const file of walk(src)) {
  const dest = join(out, relative(src, file));
  mkdirSync(dirname(dest), { recursive: true });
  const code = rewrite(readFileSync(file, "utf8"), relative(src, file).startsWith("cmdk") ? `${PKG}/cmdk` : relative(src, file).startsWith("editor") ? `${PKG}/editor` : PKG);
  if (/from\s+"\.{1,2}\//.test(code)) throw new Error(`unrewritten relative import in ${file}`);
  writeFileSync(dest, code);
}
