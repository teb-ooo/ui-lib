import { useState } from "react";
import { LineChart } from "./line-chart";
import type { ChartSeries } from "./line-chart";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "LineChart",
  group: "Molecules",
  description:
    "One to four series over time: a legend, axis ticks with formatted times and values, and a readout of every series at the point under the pointer or the arrow keys. Lines differ by dash pattern and shade, never by colour alone. A hidden summary is the text alternative. Has loading and empty states. For one value against a scale use Meter.",
  aliases: ["chart", "graph", "time series", "sparkline", "plot", "cpu chart", "metrics"],
  component: "LineChart",
  source: "src/components/line-chart.tsx",
} satisfies StoryDefault;

const start = Date.parse("2026-10-09T00:00:00Z");
const make = (n: number, step: number, f: (i: number) => number | null): ChartSeries["points"] =>
  Array.from({ length: n }, (_, i) => ({ time: new Date(start + i * step).toISOString(), value: f(i) }));

const hostCpu = make(120, 60_000, (i) => 30 + 25 * Math.sin(i / 9) + (i % 7));
const hostRam = make(120, 60_000, (i) => 55 + i / 12 + 4 * Math.sin(i / 17));
const pct = (v: number) => `${Math.round(v)} %`;

export const Default = () => (
  <LineChart
    label="Host CPU and memory, last two hours"
    series={[
      { label: "CPU", points: hostCpu },
      { label: "RAM", points: hostRam },
    ]}
    domain={[0, 100]}
    formatValue={pct}
    className="w-full max-w-2xl"
  />
);
Default.storyMeta = { description: "Percent against a fixed 0 to 100 range. Hover, or focus the plot and use Left, Right, Home, End; Escape clears." } satisfies StoryMeta;

export const WithUnit = () => (
  <LineChart
    label="Container memory over a week"
    series={[{ label: "Memory", points: make(168, 3_600_000, (i) => 300 + 120 * Math.sin(i / 11) + i) }]}
    formatValue={(v) => `${Math.round(v)} MB`}
    className="w-full max-w-2xl"
  />
);
WithUnit.storyMeta = { description: "One series, a unit on every value, a week of hourly points (the time axis shows dates)." } satisfies StoryMeta;

export const ThreeSeries = () => (
  <LineChart
    label="Network"
    series={[
      { label: "Down", points: make(90, 60_000, (i) => 40 + 30 * Math.sin(i / 8)) },
      { label: "Up", points: make(90, 60_000, (i) => 12 + 8 * Math.cos(i / 6)) },
      { label: "Errors", points: make(90, 60_000, (i) => (i > 30 && i < 40 ? null : 3 + (i % 5))) },
    ]}
    formatValue={(v) => `${Math.round(v)} Mbps`}
    className="w-full max-w-2xl"
  />
);
ThreeSeries.storyMeta = { description: "Three series are solid, dashed and dotted; a null value leaves a gap." } satisfies StoryMeta;

export const Pickable = () => {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <LineChart
      label="Host CPU, pick a moment"
      series={[{ label: "CPU", points: hostCpu }]}
      domain={[0, 100]}
      formatValue={pct}
      onSelect={setPicked}
      selected={picked}
      className="w-full max-w-2xl"
    />
  );
};
Pickable.storyMeta = { description: "onSelect gives the time of the nearest point on a click or tap, and on Enter or Space at the point the arrow keys reached; selected draws a fixed marker and a Selected line (the app keeps it in its own state)." } satisfies StoryMeta;

export const Loading = () => <LineChart label="Host CPU" series={[]} loading className="w-full max-w-2xl" />;
Loading.storyMeta = { state: "loading" } satisfies StoryMeta;
export const Empty = () => <LineChart label="Host CPU" series={[{ label: "CPU", points: [] }]} emptyText="No samples yet" className="w-full max-w-2xl" />;
