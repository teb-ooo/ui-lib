import { describe, expect, it } from "vitest";
import { fuzzyMatch, highlightRuns } from "../../src/cmdk/fuzzy";
import { rankCommands } from "../../src/cmdk/search";
import type { Command } from "../../src/cmdk/types";

const cmd = (title: string, keywords?: string[]): Command => ({ id: title, title, group: "g", keywords, run: () => undefined });

describe("fuzzyMatch", () => {
  it("matches subsequences case-insensitively and returns indices", () => {
    const m = fuzzyMatch("nwi", "New item");
    expect(m).not.toBeNull();
    expect(m?.indices).toEqual([0, 2, 4]);
  });

  it("returns null when the query is not a subsequence", () => {
    expect(fuzzyMatch("xyz", "New item")).toBeNull();
    expect(fuzzyMatch("itemz", "item")).toBeNull();
  });

  it("matches everything for an empty query", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, indices: [] });
  });

  it("ignores spaces in the query", () => {
    expect(fuzzyMatch("go set", "Go to Settings")).not.toBeNull();
  });

  it("prefers word boundaries over mid-word matches", () => {
    const boundary = fuzzyMatch("ni", "New item");
    const middle = fuzzyMatch("ni", "Renewing");
    expect(boundary && middle && boundary.score > middle.score).toBe(true);
  });

  it("prefers consecutive characters", () => {
    const consecutive = fuzzyMatch("set", "Settings");
    const scattered = fuzzyMatch("set", "Show extra tools");
    expect(consecutive && scattered && consecutive.score > scattered.score).toBe(true);
  });

  it("picks the best alignment, not the first", () => {
    // "sh" should highlight the start of "hidden"-less word "Show", not the "sh" in "Fresh" earlier in the text.
    const m = fuzzyMatch("sh", "Fresh Show");
    expect(m?.indices).toEqual([6, 7]);
  });

  it("scores an exact title above a longer one", () => {
    const exact = fuzzyMatch("item", "Item");
    const longer = fuzzyMatch("item", "Item settings");
    expect(exact && longer && exact.score > longer.score).toBe(true);
  });
});

describe("highlightRuns", () => {
  it("covers the whole string with matched runs marked", () => {
    expect(highlightRuns("New item", [0, 4, 5])).toEqual([
      ["N", true],
      ["ew ", false],
      ["it", true],
      ["em", false],
    ]);
    expect(highlightRuns("abc", [])).toEqual([["abc", false]]);
  });
});

describe("rankCommands", () => {
  const commands = [cmd("Renew subscription"), cmd("New item"), cmd("Go to Settings", ["preferences"]), cmd("Delete item")];

  it("keeps order for an empty query", () => {
    expect(rankCommands("", commands).map((r) => r.command.title)).toEqual(commands.map((c) => c.title));
  });

  it("ranks the best match first and drops non-matches", () => {
    const titles = rankCommands("new", commands).map((r) => r.command.title);
    expect(titles[0]).toBe("New item");
    expect(titles).toContain("Renew subscription");
    expect(titles).not.toContain("Delete item");
  });

  it("matches keywords without highlighting the title", () => {
    const r = rankCommands("prefer", commands);
    expect(r.map((x) => x.command.title)).toEqual(["Go to Settings"]);
    expect(r[0]?.indices).toEqual([]);
  });

  it("breaks ties by registration order", () => {
    const same = [cmd("Alpha one"), cmd("Alpha two")];
    expect(rankCommands("alpha", same).map((r) => r.command.title)).toEqual(["Alpha one", "Alpha two"]);
  });
});
