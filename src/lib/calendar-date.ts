/**
 * Calendar dates as `YYYY-MM-DD` strings: no time, no timezone, so a date never moves a day when the zone changes. They
 * compare correctly as strings.
 */

export interface YMD {
  y: number;
  m: number;
  d: number;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** `2026-10-11` to its parts, or null when it is not a real date. Also accepts `/` and a single-digit month or day. */
export function parseDate(text: string): YMD | null {
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/u.exec(text.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

export function toIso({ y, m, d }: YMD): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 is Sunday. */
export function weekday({ y, m, d }: YMD): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: YMD, days: number): YMD {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Months later (or earlier); the day is kept, or the last day of a shorter month. */
export function addMonths(date: YMD, months: number): YMD {
  const index = date.y * 12 + (date.m - 1) + months;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return { y, m, d: Math.min(date.d, daysInMonth(y, m)) };
}

export interface Cell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Six weeks of cells for a month, beginning on `weekStart` (0 is Sunday, 1 is Monday). */
export function monthGrid(y: number, m: number, weekStart: number): Cell[][] {
  const first: YMD = { y, m, d: 1 };
  const lead = (weekday(first) - weekStart + 7) % 7;
  const rows: Cell[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < 7; c++) {
      const date = addDays(first, r * 7 + c - lead);
      row.push({ iso: toIso(date), day: date.d, inMonth: date.m === m && date.y === y });
    }
    rows.push(row);
  }
  return rows;
}

/** Today as `YYYY-MM-DD` in a timezone (the browser's when none is given or it is not known). */
export function todayIn(timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    const now = new Date();
    return toIso({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
  }
}

/** `iso` kept inside `min` and `max` (each optional). */
export function clampIso(iso: string, min?: string, max?: string): string {
  if (min !== undefined && iso < min) return min;
  if (max !== undefined && iso > max) return max;
  return iso;
}
