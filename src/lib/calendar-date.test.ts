import { describe, expect, it } from "vitest";
import { addDays, addMonths, clampIso, daysInMonth, monthGrid, parseDate, toIso, weekday } from "./calendar-date";

describe("calendar dates", () => {
  it("parses real dates only, with a loose separator", () => {
    expect(parseDate("2026-10-11")).toEqual({ y: 2026, m: 10, d: 11 });
    expect(parseDate("2026/1/5")).toEqual({ y: 2026, m: 1, d: 5 });
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2026-13-01")).toBeNull();
    expect(parseDate("tomorrow")).toBeNull();
    expect(toIso({ y: 2026, m: 1, d: 5 })).toBe("2026-01-05");
  });

  it("knows leap years and weekdays", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(weekday({ y: 2026, m: 10, d: 11 })).toBe(0); // a Sunday
  });

  it("adds days and months across month and year ends, clamping the day", () => {
    expect(toIso(addDays({ y: 2026, m: 12, d: 31 }, 1))).toBe("2027-01-01");
    expect(toIso(addDays({ y: 2026, m: 3, d: 1 }, -1))).toBe("2026-02-28");
    expect(toIso(addMonths({ y: 2026, m: 1, d: 31 }, 1))).toBe("2026-02-28");
    expect(toIso(addMonths({ y: 2026, m: 1, d: 15 }, -1))).toBe("2025-12-15");
    expect(toIso(addMonths({ y: 2026, m: 11, d: 15 }, 3))).toBe("2027-02-15");
  });

  it("lays a month out as six weeks from the week start", () => {
    const sun = monthGrid(2026, 10, 0);
    expect(sun).toHaveLength(6);
    expect(sun[0]?.[0]?.iso).toBe("2026-09-27");
    expect(sun[0]?.[4]).toEqual({ iso: "2026-10-01", day: 1, inMonth: true });
    expect(sun[0]?.[0]?.inMonth).toBe(false);
    const mon = monthGrid(2026, 10, 1);
    expect(mon[0]?.[0]?.iso).toBe("2026-09-28");
  });

  it("keeps a date inside its limits", () => {
    expect(clampIso("2026-01-01", "2026-02-01", "2026-03-01")).toBe("2026-02-01");
    expect(clampIso("2026-05-01", "2026-02-01", "2026-03-01")).toBe("2026-03-01");
    expect(clampIso("2026-02-10", "2026-02-01", "2026-03-01")).toBe("2026-02-10");
    expect(clampIso("2026-02-10")).toBe("2026-02-10");
  });
});
