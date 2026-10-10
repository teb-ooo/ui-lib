import { describe, expect, it } from "vitest";
import { rng, shuffleWord } from "./ruin";
import { BEAM_Y, COLLAPSE_AT, RuinedSwing, SNAP_AT } from "./ruin-swing";

describe("ruin", () => {
  it("a seeded random source repeats", () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(rng(8)()).not.toBe(rng(7)());
  });

  it("shuffleWord keeps the letters and the spaces, and puts them in a new order", () => {
    const out = shuffleWord("EXPIRED INVITE", rng(5));
    expect([...out].sort().join("")).toBe([..."EXPIRED INVITE"].sort().join(""));
    expect(out[7]).toBe(" ");
    expect(out).not.toBe("EXPIRED INVITE");
    expect(shuffleWord("", rng(1))).toBe("");
  });
});

describe("the ruined swingset", () => {
  const run = (swing: RuinedSwing, seconds: number) => {
    for (let i = 0; i < seconds * 60; i += 1) swing.step(1 / 60);
  };

  it("hangs together before the snap: the frame is standing and every rope link keeps its length", () => {
    const s = new RuinedSwing(1);
    run(s, SNAP_AT - 0.5);
    expect(s.sticks.every((st) => !st.free)).toBe(true);
    const lines = s.lines().filter((l) => l.kind === "rope");
    for (const l of lines) expect(Math.hypot(l.a[0] - l.b[0], l.a[1] - l.b[1], l.a[2] - l.b[2])).toBeLessThan(0.46); // 2.2 / 6 = 0.37, a little stretch allowed
  });

  it("a rope snaps, the frame comes apart and falls, and the wreck ends on the ground", () => {
    const s = new RuinedSwing(2);
    run(s, SNAP_AT + 0.2);
    expect(s.ropes.some((r) => r.broken >= 0)).toBe(true);
    expect(s.take().some((e) => e.kind === "snap")).toBe(true);
    run(s, 5.5);
    expect(s.sticks.every((st) => st.free)).toBe(true);
    for (const st of s.sticks) {
      expect(st.a[1]).toBeGreaterThanOrEqual(-0.01);
      expect(st.b[1]).toBeGreaterThanOrEqual(-0.01);
      expect(Math.max(st.a[1], st.b[1])).toBeLessThan(BEAM_Y); // nothing is left up on the beam
    }
    for (const c of s.seat()) expect(c[1]).toBeGreaterThanOrEqual(-0.01);
    expect(Number.isFinite(s.seat()[0]![0])).toBe(true);
  });

  it("the same seed gives the same ruin, and it is angrier from the start in later cycles", () => {
    const a = new RuinedSwing(9);
    const b = new RuinedSwing(9);
    run(a, 3);
    run(b, 3);
    expect(a.seat()).toEqual(b.seat());
    expect(new RuinedSwing(1, 1).chaos()).toBeGreaterThan(new RuinedSwing(1, 0).chaos());
    const c = new RuinedSwing(3);
    run(c, COLLAPSE_AT + 0.1);
    expect(c.chaos()).toBe(1);
  });
});
