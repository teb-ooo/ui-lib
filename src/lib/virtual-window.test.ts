import { describe, expect, it } from "vitest";
import { buildOffsets, fixedRange, indexAt, measuredRange, scrollTopFor } from "./virtual-window";

describe("virtual window", () => {
  it("fixedRange draws the visible items plus overscan, clamped to the list", () => {
    expect(fixedRange(1000, 20, 0, 200, 3)).toEqual({ first: 0, last: 13 });
    expect(fixedRange(1000, 20, 2000, 200, 3)).toEqual({ first: 97, last: 113 });
    expect(fixedRange(1000, 20, 99999, 200, 3)).toEqual({ first: 987, last: 1000 });
    expect(fixedRange(0, 20, 0, 200, 3)).toEqual({ first: 0, last: 0 });
  });

  it("buildOffsets uses a measured height where there is one and the estimate elsewhere", () => {
    const o = buildOffsets(4, (i) => (i === 1 ? 100 : undefined), 10);
    expect([...o]).toEqual([0, 10, 110, 120, 130]);
  });

  it("indexAt finds the item that holds a position", () => {
    const o = buildOffsets(4, (i) => (i === 1 ? 100 : undefined), 10);
    expect(indexAt(o, 0)).toBe(0);
    expect(indexAt(o, 9)).toBe(0);
    expect(indexAt(o, 10)).toBe(1);
    expect(indexAt(o, 109)).toBe(1);
    expect(indexAt(o, 110)).toBe(2);
    expect(indexAt(o, 5000)).toBe(3);
  });

  it("measuredRange follows the real heights", () => {
    const o = buildOffsets(100, (i) => (i < 10 ? 50 : undefined), 10);
    // 0..500 is ten tall items; a 100px viewport at 0 sees items 0 and 1 (0..100), plus overscan 2
    expect(measuredRange(o, 0, 100, 2)).toEqual({ first: 0, last: 5 });
    // at 500 the estimated 10px items begin: the viewport holds ten of them
    expect(measuredRange(o, 500, 100, 0)).toEqual({ first: 10, last: 21 });
  });

  it("scrollTopFor moves as little as possible, or places the item", () => {
    expect(scrollTopFor(100, 20, 90, 100, "nearest")).toBe(90); // already visible
    expect(scrollTopFor(50, 20, 90, 100, "nearest")).toBe(50); // above: align its top
    expect(scrollTopFor(250, 20, 90, 100, "nearest")).toBe(170); // below: align its bottom
    expect(scrollTopFor(100, 20, 0, 100, "start")).toBe(100);
    expect(scrollTopFor(100, 20, 0, 100, "center")).toBe(60);
    expect(scrollTopFor(100, 20, 150, 100, "nearest", 30)).toBe(70); // a 30px sticky header covers the top
  });
});
