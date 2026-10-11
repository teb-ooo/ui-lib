import { forwardRef, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { fmtDate, getPlayground } from "@teb-ooo/web";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, clampIso, monthGrid, parseDate, toIso, todayIn, weekday } from "../lib/calendar-date";
import type { YMD } from "../lib/calendar-date";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";
import { Popover } from "./popover";

export interface DateFieldProps {
  /** Visible name, tied to the input. */
  label: ReactNode;
  /** Keep the label for screen readers only. @default false */
  hideLabel?: boolean;
  /** The date as `YYYY-MM-DD` (a calendar date: no time, no timezone), or `null` while the field is empty. */
  value: string | null;
  /** Called with the new date, or `null` when the field is cleared: a day picked in the calendar, a typed date once it is valid, Today, Clear. */
  onValueChange: (value: string | null) => void;
  /** The earliest and latest date that can be chosen, as `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  /** Shown while the field is empty. @default "YYYY-MM-DD" */
  placeholder?: string;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  /** Label of the button that opens the calendar. @default "Choose date" */
  chooseLabel?: string;
  /** Label of the calendar's Today button. @default "Today" */
  todayLabel?: string;
  /** Label of the calendar's Clear button. @default "Clear" */
  clearLabel?: string;
  /** Layout classes (the width). */
  className?: string;
}

const noon = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** A date, typed or picked: the box shows it in the person's locale and takes `YYYY-MM-DD` while it is edited; the button beside it opens a calendar. */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { label, hideLabel, value, onValueChange, min, max, placeholder = "YYYY-MM-DD", description, error, disabled, chooseLabel = "Choose date", todayLabel = "Today", clearLabel = "Clear", className },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? fmtDate(noon(value), { timeZone: "UTC" }) : "");
  const outside = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);
  const parsed = draft === null || draft.trim() === "" ? null : parseDate(draft);
  const invalidDraft = draft !== null && draft.trim() !== "" && (parsed === null || outside(toIso(parsed)));
  const commit = () => {
    if (draft === null) return;
    if (draft.trim() === "") onValueChange(null);
    else if (parsed && !outside(toIso(parsed))) onValueChange(toIso(parsed));
    setDraft(null);
  };
  const choose = (iso: string | null) => {
    onValueChange(iso);
    setDraft(null);
    setOpen(false);
  };
  return (
    <Field label={label} {...(hideLabel ? { hideLabel } : {})} description={description} error={error ?? (invalidDraft ? "Enter a date as YYYY-MM-DD." : undefined)} className={cn("w-56", className)}>
      <div className="flex items-stretch gap-1">
        <Input
          ref={ref}
          value={shown}
          placeholder={placeholder}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={invalidDraft || undefined}
          onFocus={() => setDraft(value ?? "")}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
            } else if (e.key === "ArrowDown" && e.altKey) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="min-w-0 flex-1"
        />
        <Popover
          title={typeof label === "string" ? label : chooseLabel}
          open={open}
          onOpenChange={setOpen}
          align="end"
          trigger={<Button icon={<CalendarDays aria-hidden="true" className="size-4" />} aria-label={chooseLabel} disabled={disabled} />}
          className="w-auto"
        >
          <Calendar value={value} min={min} max={max} todayLabel={todayLabel} clearLabel={clearLabel} onChoose={choose} />
        </Popover>
      </div>
    </Field>
  );
});

/** First day of the week for the playground's locale (0 is Sunday); Sunday when the browser cannot say. */
function weekStartFor(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const first = l.getWeekInfo?.().firstDay ?? l.weekInfo?.firstDay;
    return first === undefined ? 0 : first % 7;
  } catch {
    return 0;
  }
}

interface CalendarProps {
  value: string | null;
  min: string | undefined;
  max: string | undefined;
  todayLabel: string;
  clearLabel: string;
  onChoose: (iso: string | null) => void;
}

/** A month of days as a grid: arrows move by a day or a week, Page Up and Page Down by a month, Home and End to the week's ends; Enter or Space picks. */
function Calendar({ value, min, max, todayLabel, clearLabel, onChoose }: CalendarProps) {
  const { locale, timezone } = getPlayground();
  const today = todayIn(timezone);
  const start = clampIso(value ?? today, min, max);
  const [cursor, setCursor] = useState(start);
  const grid = useRef<HTMLDivElement>(null);
  const weekStart = weekStartFor(locale);
  const dayName = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const names = Array.from({ length: 7 }, (_, i) => dayName.format(new Date(Date.UTC(2024, 0, 7 + ((weekStart + i) % 7)))));
  const cur = parseDate(cursor) as YMD;
  const rows = monthGrid(cur.y, cur.m, weekStart);
  const title = fmtDate(noon(toIso({ ...cur, d: 1 })), { timeZone: "UTC", month: "long", year: "numeric" });
  const off = (iso: string) => (min !== undefined && iso < min) || (max !== undefined && iso > max);

  // Focus goes to the chosen day when the calendar opens, and follows the keys after that.
  useEffect(() => {
    grid.current?.querySelector<HTMLElement>(`[data-date="${cursor}"]`)?.focus();
  }, [cursor]);

  const go = (next: YMD) => setCursor(clampIso(toIso(next), min, max));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, YMD> = {
      ArrowLeft: addDays(cur, -1),
      ArrowRight: addDays(cur, 1),
      ArrowUp: addDays(cur, -7),
      ArrowDown: addDays(cur, 7),
      PageUp: addMonths(cur, -1),
      PageDown: addMonths(cur, 1),
      Home: addDays(cur, -((weekday(cur) - weekStart + 7) % 7)),
      End: addDays(cur, 6 - ((weekday(cur) - weekStart + 7) % 7)),
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    go(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button icon={<ChevronLeft aria-hidden="true" className="size-4" />} aria-label="Previous month" onClick={() => go(addMonths(cur, -1))} className="border-transparent" />
        <p aria-live="polite" className="text-ink">
          {title}
        </p>
        <Button icon={<ChevronRight aria-hidden="true" className="size-4" />} aria-label="Next month" onClick={() => go(addMonths(cur, 1))} className="border-transparent" />
      </div>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the day buttons inside are the focus stops (a roving tab stop); the grid only receives their key events */}
      <div ref={grid} role="grid" aria-label={title} onKeyDown={onKeyDown} className="flex flex-col gap-0.5">
        <div role="row" className="grid grid-cols-7 text-center text-ink-faint">
          {names.map((n) => (
            <span key={n} role="columnheader" className="uppercase">
              {n}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row[0]?.iso} role="row" className="grid grid-cols-7 gap-0.5">
            {row.map((cell) => {
              const selected = cell.iso === value;
              return (
                <div key={cell.iso} role="gridcell" aria-selected={selected} className="flex justify-center">
                  <button
                    type="button"
                    data-date={cell.iso}
                    tabIndex={cell.iso === cursor ? 0 : -1}
                    disabled={off(cell.iso)}
                    aria-label={fmtDate(noon(cell.iso), { timeZone: "UTC", dateStyle: "full" })}
                    aria-current={cell.iso === today ? "date" : undefined}
                    onClick={() => onChoose(cell.iso)}
                    className={cn(
                      "flex h-[var(--target-h)] w-full min-w-[var(--target-h)] cursor-pointer items-center justify-center rounded text-ink tabular-nums outline-none hover-invert focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-30",
                      !cell.inMonth && "text-ink-faint",
                      cell.iso === today && !selected && "border border-line-strong",
                      selected && "bg-ink text-ground",
                    )}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 border-t border-line pt-2">
        <Button disabled={off(today)} onClick={() => onChoose(today)}>
          {todayLabel}
        </Button>
        <Button onClick={() => onChoose(null)}>{clearLabel}</Button>
      </div>
    </div>
  );
}
