import { describe, expect, it } from "vitest";
import { COLLAPSE, CYCLE, corruptText, momentAt, rng, shuffleWord, wave } from "./ruin";

describe("ruin", () => {
  it("a seeded random source repeats", () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(rng(8)()).not.toBe(rng(7)());
  });

  it("chaos builds over a cycle, collapses at its end, and each cycle starts angrier", () => {
    expect(momentAt(0).chaos).toBeLessThan(0.3);
    expect(momentAt(CYCLE / 2).chaos).toBeGreaterThan(momentAt(1).chaos);
    expect(momentAt(CYCLE - COLLAPSE - 0.1).collapse).toBe(0);
    expect(momentAt(CYCLE - 0.05).collapse).toBeGreaterThan(0.9);
    expect(momentAt(CYCLE + 0.1).collapse).toBe(0);
    expect(momentAt(CYCLE * 2 + 0.1).chaos).toBeGreaterThan(momentAt(0.1).chaos);
    for (let t = 0; t < 60; t += 0.37) expect(momentAt(t).chaos).toBeLessThanOrEqual(1);
  });

  it("the word is itself at no chaos and wrecked at full chaos, and keeps its spaces", () => {
    expect(corruptText("TOO BAD", 0, rng(1))).toBe("TOO BAD");
    const wrecked = corruptText("TOO BAD", 1, rng(1));
    expect(wrecked).not.toBe("TOO BAD");
    expect(wrecked[3]).toBe(" ");
    expect(wrecked).toHaveLength("TOO BAD".length);
  });

  it("a wave is a clean sine at no chaos and always inside -1 and 1", () => {
    const r = rng(3);
    expect(wave(0.25, 0, 0, r, 0)).toBeCloseTo(wave(0.25, 0, 0, rng(9), 0), 10);
    for (let i = 0; i < 500; i += 1) {
      const v = wave(i / 500, i / 50, i / 500, r, i % 3);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
  });

  it("shuffleWord keeps the letters and the spaces, and puts them in a new order", () => {
    const out = shuffleWord("EXPIRED INVITE", rng(5));
    expect([...out].sort().join("")).toBe([..."EXPIRED INVITE"].sort().join(""));
    expect(out[7]).toBe(" ");
    expect(out).not.toBe("EXPIRED INVITE");
    expect(shuffleWord("BAD", rng(1))).toHaveLength(3);
    expect(shuffleWord("", rng(1))).toBe("");
  });
});
