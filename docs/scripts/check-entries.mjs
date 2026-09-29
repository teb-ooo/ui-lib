// Exit check: every component exported by ../src/index.ts has an entry in the built site's manifest.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexSrc = readFileSync(join(docsRoot, "..", "src", "index.ts"), "utf8");
const manifestPath = join(docsRoot, "dist", "manifest.json");

/** Value exports of the entry that are not components. Keep in step with the ui story-coverage test. */
const NON_COMPONENTS = new Set(["initialsOf"]);

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error(`check-entries: cannot read ${manifestPath}: ${e.message}`);
  process.exit(1);
}

const exported = [];
for (const m of indexSrc.matchAll(/^export\s*\{([^}]*)\}\s*from\s*"[^"]+";?$/gm)) {
  for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) exported.push(n);
}
const components = exported.filter((n) => !NON_COMPONENTS.has(n));
const documented = new Set(
  manifest.entries.filter((e) => e.package === "@teb-ooo/ui" && e.variants.length > 0).map((e) => e.component),
);
const missing = components.filter((c) => !documented.has(c));
const groups = new Set(manifest.entries.map((e) => e.group));

if (missing.length > 0) {
  console.error(`check-entries: no gallery entry for exported component(s): ${missing.join(", ")}`);
  process.exit(1);
}
console.log(
  `check-entries ok: ${components.length} exported components, ${manifest.entries.length} entries in ${groups.size} groups`,
);
