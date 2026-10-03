import { describe, expect, it } from "vitest";
// @ts-expect-error a plain ES module script without types
import { peerProblems } from "../scripts/check-peers.mjs";

const satisfies = (v: string, range: string) => range.split("||").some((r) => {
  const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(r.trim());
  const w = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m || !w) return false;
  const [, a, b, c] = m.map(Number);
  const [, x, y, z] = w.map(Number);
  return a === 0 ? x === 0 && y === b && z! >= c! : x === a && (y! > b! || (y === b && z! >= c!));
});

describe("peer check", () => {
  const own = { name: "@teb-ooo/ui", peerDependencies: { "@teb-ooo/web": "^0.7.5" } };
  const latest = (n: string) => (n === "@teb-ooo/web" ? "0.8.0" : null);

  it("refuses a peer range that excludes the sibling's latest version", () => {
    const problems = peerProblems(own, "0.39.0", latest, () => undefined, satisfies);
    expect(problems.join()).toContain("does not accept its latest version 0.8.0");
  });

  it("refuses a new version that a sibling's latest peer range excludes", () => {
    const web = { name: "@teb-ooo/web", peerDependencies: {} };
    const problems = peerProblems(web, "0.9.0", (n: string) => (n === "@teb-ooo/ui" ? "0.39.1" : null), (n: string) => (n === "@teb-ooo/ui" ? { "@teb-ooo/web": "^0.7.5 || ^0.8.0" } : undefined), satisfies);
    expect(problems.join()).toContain("does not accept 0.9.0");
  });

  it("passes when both directions resolve", () => {
    const ok = { name: "@teb-ooo/ui", peerDependencies: { "@teb-ooo/web": "^0.7.5 || ^0.8.0" } };
    expect(peerProblems(ok, "0.40.0", latest, (n: string) => (n === "@teb-ooo/web" ? {} : undefined), satisfies)).toEqual([]);
  });
});
