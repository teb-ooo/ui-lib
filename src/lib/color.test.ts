import { describe, expect, it } from "vitest";
import { hexToRgb, hsvToHex, hsvToRgb, rgbToHex, rgbToHsv } from "./color";

describe("color", () => {
  it("parses hex in the forms people type, and refuses the rest", () => {
    expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
    expect(hexToRgb("FF8000")).toEqual([255, 128, 0]);
    expect(hexToRgb("#f80")).toEqual([255, 136, 0]);
    expect(hexToRgb(" #0a0b0c ")).toEqual([10, 11, 12]);
    expect(hexToRgb("#ff80")).toBeNull();
    expect(hexToRgb("#gg0000")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });

  it("writes lower-case #rrggbb, rounded and clamped", () => {
    expect(rgbToHex(255, 128, 0)).toBe("#ff8000");
    expect(rgbToHex(300, -5, 127.6)).toBe("#ff0080");
  });

  it("converts RGB and HSV both ways", () => {
    expect(rgbToHsv([255, 0, 0])).toEqual({ h: 0, s: 1, v: 1 });
    expect(rgbToHsv([0, 255, 0]).h).toBe(120);
    expect(rgbToHsv([0, 0, 255]).h).toBe(240);
    expect(rgbToHsv([0, 0, 0])).toEqual({ h: 0, s: 0, v: 0 });
    expect(hsvToRgb({ h: 60, s: 1, v: 1 })).toEqual([255, 255, 0]);
    expect(hsvToHex({ h: 200, s: 0, v: 0.5 })).toBe("#808080");
    for (const hex of ["#123456", "#abcdef", "#ff00aa", "#808080", "#010203"]) {
      expect(hsvToHex(rgbToHsv(hexToRgb(hex)!))).toBe(hex);
    }
  });
});
