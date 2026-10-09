import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";

export interface ChartPoint {
  /** When: an RFC3339 string, epoch milliseconds or a `Date`. */
  time: string | number | Date;
  /** The value; `null` leaves a gap in the line. */
  value: number | null;
}

export interface ChartSeries {
  /** The series' name: in the legend, the readout and the text alternative. */
  label: string;
  /** Points in time order. Series may have different times. */
  points: readonly ChartPoint[];
}

export interface LineChartProps {
  /** What the chart shows; its accessible name. */
  label: string;
  /** One to four lines. They differ by dash pattern and shade as well as by name, never by colour alone. */
  series: readonly ChartSeries[];
  /** Turns a value into the text on the axis, the readout and the summary, for example `(v) => `${v} %``. @default the number */
  formatValue?: (value: number, series: ChartSeries) => string;
  /** The value range of the y axis. @default 0 to the largest value, rounded up to a round number */
  domain?: readonly [number, number];
  /** Turns a time (epoch milliseconds) into an axis label; the second argument is the span shown in milliseconds. @default clock time up to two days, else the date */
  formatTime?: (ms: number, spanMs: number) => string;
  /** Shows a placeholder instead of the lines while the data loads. @default false */
  loading?: boolean;
  /** The text when there are no points. @default "No data" */
  emptyText?: string;
  /** Height of the plot in pixels. @default 200 */
  height?: number;
  className?: string;
}

const dashes = ["", "6 3", "2 3", "8 3 2 3"];
const strokes = ["stroke-ink", "stroke-ink-muted", "stroke-ink", "stroke-ink-muted"];
const fills = ["fill-ink", "fill-ink-muted", "fill-ink", "fill-ink-muted"];
const margin = { top: 8, right: 8, bottom: 22, left: 48 };

const toMs = (t: ChartPoint["time"]) => (t instanceof Date ? t.getTime() : typeof t === "number" ? t : Date.parse(t));

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

const defaultTime = (ms: number, span: number) =>
  new Intl.DateTimeFormat(undefined, span <= 2 * 864e5 ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" }).format(ms);
const fullTime = (ms: number) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(ms);

interface Prepared {
  s: ChartSeries;
  pts: { t: number; v: number | null }[];
}

/** The index of the point at or nearest to `t`; the points are in time order. */
function nearest(pts: Prepared["pts"], t: number): number {
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid]!.t < t) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && Math.abs(pts[lo - 1]!.t - t) <= Math.abs(pts[lo]!.t - t) ? lo - 1 : lo;
}

/**
 * A line chart of one to four series over time: a legend, axis ticks, and a readout of every series' value at a point
 * that follows the pointer or the Left, Right, Home and End keys (the plot takes focus; Escape clears the point). The
 * lines use the ink tones with distinct dash patterns, so colour is never the only difference. A visually hidden summary
 * (the range, the lowest, the highest and the latest value of each series) is the text alternative. It draws SVG itself and
 * adds no dependency. For a single quantity against a scale use `Meter`.
 */
export function LineChart({ label, series, formatValue, domain, formatTime = defaultTime, loading = false, emptyText = "No data", height = 200, className }: LineChartProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [cursor, setCursor] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(Math.max(200, Math.round(el.clientWidth))));
    ro.observe(el);
    setWidth(Math.max(200, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const data = useMemo<Prepared[]>(
    () => series.map((s) => ({ s, pts: s.points.map((p) => ({ t: toMs(p.time), v: p.value })).filter((p) => Number.isFinite(p.t)) })),
    [series],
  );
  const all = data.flatMap((d) => d.pts);
  const fmt = (v: number, s: ChartSeries) => (formatValue ? formatValue(v, s) : String(v));

  const frame = cn("flex min-w-0 flex-col gap-2", className);
  if (loading) {
    return (
      <div className={frame} aria-busy="true" aria-label={label} role="group">
        <div className="flex items-center justify-center rounded border border-line text-ink-faint motion-safe:animate-pulse" style={{ height }}>
          Loading
        </div>
      </div>
    );
  }
  if (all.length === 0) {
    return (
      <div className={frame} role="group" aria-label={label}>
        <div className="flex items-center justify-center rounded border border-line text-ink-faint" style={{ height }}>
          {emptyText}
        </div>
      </div>
    );
  }

  const tMin = Math.min(...all.map((p) => p.t));
  const tMax = Math.max(...all.map((p) => p.t));
  const values = all.map((p) => p.v).filter((v): v is number => v !== null);
  const yMin = domain ? domain[0] : 0;
  const yMax = domain ? domain[1] : niceCeil(Math.max(...values, 0));
  const plotW = Math.max(1, width - margin.left - margin.right);
  const plotH = height - margin.top - margin.bottom;
  const x = (t: number) => margin.left + (tMax === tMin ? plotW / 2 : ((t - tMin) / (tMax - tMin)) * plotW);
  const y = (v: number) => margin.top + plotH - ((Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin || 1)) * plotH;

  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + ((yMax - yMin) * i) / 4);
  const nx = Math.max(2, Math.min(7, Math.floor(plotW / 90)));
  const xTicks = Array.from({ length: nx }, (_, i) => tMin + ((tMax - tMin) * i) / (nx - 1));

  const paths = data.map(({ pts }) => {
    let d = "";
    let pen = false;
    for (const p of pts) {
      if (p.v === null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`;
      pen = true;
    }
    return d;
  });

  // The point under the cursor is a time; every series reports its own nearest point.
  const at = cursor === null ? null : cursor;
  const readout = at === null ? null : data.map(({ s, pts }) => (pts.length ? { s, p: pts[nearest(pts, at)]! } : null));
  const driver = data.reduce((a, b) => (b.pts.length > a.pts.length ? b : a), data[0]!).pts;

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * width;
    setCursor(Math.min(tMax, Math.max(tMin, tMin + ((px - margin.left) / plotW) * (tMax - tMin))));
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = at === null ? -1 : nearest(driver, at);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(driver.length - 1, i + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, i < 0 ? driver.length - 1 : i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = driver.length - 1;
    else if (e.key === "Escape") {
      setCursor(null);
      return;
    } else return;
    e.preventDefault();
    setCursor(driver[next]!.t);
  };

  const summary = data
    .filter((d) => d.pts.some((p) => p.v !== null))
    .map(({ s, pts }) => {
      const vs = pts.map((p) => p.v).filter((v): v is number => v !== null);
      const last = [...pts].reverse().find((p) => p.v !== null)!;
      return `${s.label}: lowest ${fmt(Math.min(...vs), s)}, highest ${fmt(Math.max(...vs), s)}, latest ${fmt(last.v!, s)}.`;
    })
    .join(" ");

  return (
    <div className={frame} role="group" aria-label={label}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ink-muted" aria-label="Legend">
        {data.map(({ s }, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <svg width="24" height="8" aria-hidden="true" className="shrink-0">
              <line x1="0" y1="4" x2="24" y2="4" strokeWidth="2" strokeDasharray={dashes[i % 4] || undefined} className={strokes[i % 4]} />
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
      <div ref={box} className="min-w-0">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- the plot is a keyboard-operable chart (arrow keys move a point), described by role and roledescription */}
        <div
          tabIndex={0} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- see above
          role="application"
          aria-roledescription="line chart"
          aria-label={`${label}. Left and Right move between points.`}
          aria-describedby={`${id}-sum`}
          onKeyDown={key}
          onBlur={() => setCursor(null)}
          className="rounded outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-ink"
        >
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" onPointerMove={move} onPointerLeave={() => setCursor(null)} className="block max-w-full touch-pan-y">
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={margin.left} x2={width - margin.right} y1={y(v)} y2={y(v)} className="stroke-line" strokeWidth="1" />
                <text x={margin.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-ink-faint">
                  {formatValue ? formatValue(v, series[0]!) : String(Math.round(v * 100) / 100)}
                </text>
              </g>
            ))}
            {xTicks.map((t, i) => (
              <text key={i} x={x(t)} y={height - 6} textAnchor={i === 0 ? "start" : i === nx - 1 ? "end" : "middle"} className="fill-ink-faint">
                {formatTime(t, tMax - tMin)}
              </text>
            ))}
            {paths.map((d, i) => (
              <path key={i} d={d} fill="none" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray={dashes[i % 4] || undefined} className={strokes[i % 4]} />
            ))}
            {at !== null ? <line x1={x(at)} x2={x(at)} y1={margin.top} y2={margin.top + plotH} className="stroke-ink-faint" strokeWidth="1" /> : null}
            {readout?.map((r, i) =>
              r && r.p.v !== null ? <circle key={r.s.label} cx={x(r.p.t)} cy={y(r.p.v)} r="3.5" className={cn(fills[i % 4], "stroke-surface")} strokeWidth="1.5" /> : null,
            )}
          </svg>
        </div>
      </div>
      <p className="min-h-[1lh] text-ink-muted" aria-live="polite">
        {readout && at !== null ? (
          <>
            <span className="text-ink">{fullTime(at)}</span>
            {readout.map((r) => (r && r.p.v !== null ? <span key={r.s.label}>{`  ${r.s.label} ${fmt(r.p.v, r.s)}`}</span> : null))}
          </>
        ) : null}
      </p>
      <p id={`${id}-sum`} className="sr-only">
        {fullTime(tMin)} to {fullTime(tMax)}. {summary}
      </p>
    </div>
  );
}
