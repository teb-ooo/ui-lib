import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildReference, collectExports } from "../scripts/reference.ts";

const reference = readFileSync(join(import.meta.dirname, "..", "docs", "reference.md"), "utf8");

describe("docs/reference.md", () => {
  it("is what `npm run build:reference` makes from the source", () => {
    expect(reference).toBe(buildReference());
  });
  it("has an entry for every export of every entry point", () => {
    for (const { path, entries } of collectExports()) {
      const section = reference.slice(reference.indexOf(`## ${path}\n`));
      for (const e of entries.filter((x) => x.kind !== "type")) expect(section, `${path} ${e.name}`).toContain(`### ${e.name}\n`);
      for (const e of entries.filter((x) => x.kind === "type" && !(x.name.endsWith("Props") && entries.some((o) => o.kind !== "type" && o.name === x.name.slice(0, -5))))) {
        expect(section, `${path} type ${e.name}`).toContain(`- \`${e.name}\``);
      }
    }
  });
  it("describes every value export", () => {
    const bare = collectExports().flatMap(({ path, entries }) => entries.filter((e) => e.kind !== "type" && e.summary === "").map((e) => `${path} ${e.name}`));
    expect(bare, "exports with no doc comment").toEqual([]);
  });
  it("carries no version stamps, and neither does the guide", () => {
    const guide = readFileSync(join(import.meta.dirname, "..", "docs", "components.md"), "utf8");
    for (const text of [reference, guide]) expect(text.match(/\b(?:ui |web |v)?0\.\d{1,3}\.\d{1,3}\b/gu) ?? []).toEqual([]);
  });
});
