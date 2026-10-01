import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, KeyboardEvent, MouseEvent } from "react";
import { cn } from "../lib/cn";
import { ToggleGroup } from "./toggle-group";

export interface GraphNode {
  id: string;
  label: string;
  /** The node's type: a key of `kinds`. It is drawn as a shape, an icon and a legend entry, never as a colour. */
  kind: string;
  /** A draft node is drawn dashed and faint. */
  draft?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  /** The relation, drawn on the line and read in the list. */
  label?: string;
  /** A draft edge is dashed. */
  draft?: boolean;
}

export interface GraphKind {
  /** Name in the legend and in the list. */
  label: string;
  /** A Lucide icon, drawn inside the node. */
  icon?: ComponentType<{ size?: number; x?: number; y?: number; "aria-hidden"?: boolean | "true" | "false" }>;
}

export interface GraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** The ego node: the one the network is centred on, drawn larger and fixed in the middle. */
  centerId: string;
  /** Types by `kind`. A kind without an entry is shown by its key. */
  kinds?: Record<string, GraphKind>;
  /** Most hops from the centre that exist in `nodes` and can be shown. @default 2 */
  maxDepth?: number;
  /** Hops shown (controlled). Uncontrolled starts at `maxDepth`. */
  depth?: number;
  onDepthChange?: (depth: number) => void;
  /** A node was chosen (click, Enter or Space). */
  onNodeSelect?: (node: GraphNode) => void;
  /** Link target of a node, so it is a real link (open in a new tab, copy address). With `onNodeSelect`, a plain click calls that instead. */
  nodeHref?: (node: GraphNode) => string;
  /** Accessible name of the graph. @default "Relations" */
  label?: string;
  /** Show the relation labels on the lines. @default true */
  showEdgeLabels?: boolean;
  className?: string;
}

const clip = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export interface LaidOutNode extends GraphNode {
  x: number;
  y: number;
  depth: number;
}

/** Hops from `centerId` to every reachable node (edges are followed both ways). */
export function hopsFrom(centerId: string, edges: Pick<GraphEdge, "source" | "target">[]): Map<string, number> {
  const next = new Map<string, string[]>();
  for (const e of edges) {
    (next.get(e.source) ?? next.set(e.source, []).get(e.source))?.push(e.target);
    (next.get(e.target) ?? next.set(e.target, []).get(e.target))?.push(e.source);
  }
  const depth = new Map<string, number>([[centerId, 0]]);
  const queue = [centerId];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i] ?? "";
    for (const n of next.get(id) ?? []) {
      if (!depth.has(n)) {
        depth.set(n, (depth.get(id) ?? 0) + 1);
        queue.push(n);
      }
    }
  }
  return depth;
}

/**
 * A deterministic force layout: nodes repel, edges pull, the centre node stays put. The same input always gives the
 * same picture, so a graph does not jump when it re-renders.
 */
export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[], centerId: string, width: number, height: number): LaidOutNode[] {
  const hops = hopsFrom(centerId, edges);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 36;
  const byDepth = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const d = hops.get(n.id) ?? 1;
    (byDepth.get(d) ?? byDepth.set(d, []).get(d))?.push(n);
  }
  const maxHop = Math.max(1, ...byDepth.keys());
  const pos = new Map<string, { x: number; y: number; depth: number }>();
  for (const [d, group] of byDepth) {
    group.forEach((n, i) => {
      if (n.id === centerId) {
        pos.set(n.id, { x: cx, y: cy, depth: 0 });
        return;
      }
      const angle = (2 * Math.PI * i) / group.length + d * 0.6;
      const r = (radius * d) / maxHop;
      pos.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), depth: d });
    });
  }
  const live = edges.filter((e) => pos.has(e.source) && pos.has(e.target));
  const ids = nodes.map((n) => n.id);
  const labelOf = new Map(nodes.map((n) => [n.id, n.label]));
  const ideal = Math.max(60, Math.min(110, radius / maxHop));
  for (let step = 0; step < 200; step++) {
    const cool = 1 - step / 200;
    const force = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i] ?? "");
        const b = pos.get(ids[j] ?? "");
        if (!a || !b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          dx = (i - j) * 0.1;
          dy = 0.1;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const f = (ideal * ideal) / d2;
        const fa = force.get(ids[i] ?? "");
        const fb = force.get(ids[j] ?? "");
        if (fa && fb) {
          fa.x += (dx / d) * f * d;
          fa.y += (dy / d) * f * d;
          fb.x -= (dx / d) * f * d;
          fb.y -= (dy / d) * f * d;
        }
      }
    }
    for (const e of live) {
      const a = pos.get(e.source);
      const b = pos.get(e.target);
      const fa = force.get(e.source);
      const fb = force.get(e.target);
      if (!a || !b || !fa || !fb) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = ((d - ideal) / ideal) * 0.5 * d * 0.2;
      fa.x += (dx / d) * f;
      fa.y += (dy / d) * f;
      fb.x -= (dx / d) * f;
      fb.y -= (dy / d) * f;
    }
    for (const id of ids) {
      const p = pos.get(id);
      const f = force.get(id);
      if (!p || !f || id === centerId) continue;
      f.x += (cx - p.x) * 0.05;
      f.y += (cy - p.y) * 0.05;
      const len = Math.sqrt(f.x * f.x + f.y * f.y) || 1;
      const move = Math.min(len, 12 * cool + 0.5);
      // The label hangs below the node and is centred on it: keep the whole label inside.
      const half = Math.max(24, Math.min(clip(labelOf.get(id) ?? "").length, 18) * 4.5 + 4);
      p.x = Math.min(width - half, Math.max(half, p.x + (f.x / len) * move));
      p.y = Math.min(height - 36, Math.max(24, p.y + (f.y / len) * move));
    }
  }
  return nodes.map((n) => {
    const p = pos.get(n.id) ?? { x: cx, y: cy, depth: 1 };
    return { ...n, x: p.x, y: p.y, depth: p.depth };
  });
}

const SHAPES = ["circle", "square", "diamond", "triangle", "hexagon", "pentagon"] as const;
type Shape = (typeof SHAPES)[number];

function shapePath(shape: Shape, r: number): string {
  const poly = (n: number, rot: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = rot + (2 * Math.PI * i) / n;
      return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
  switch (shape) {
    case "square":
      return `M${-r * 0.85},${-r * 0.85}h${r * 1.7}v${r * 1.7}h${-r * 1.7}z`;
    case "diamond":
      return `M0,${-r * 1.15}L${r * 1.15},0L0,${r * 1.15}L${-r * 1.15},0z`;
    case "triangle":
      return `M${poly(3, -Math.PI / 2).replace(/ /g, "L")}z`;
    case "hexagon":
      return `M${poly(6, 0).replace(/ /g, "L")}z`;
    case "pentagon":
      return `M${poly(5, -Math.PI / 2).replace(/ /g, "L")}z`;
    default:
      return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0z`;
  }
}

/**
 * An ego network: one node in the middle and what it relates to, one or two hops out. Colour is state only, so a node's
 * type is its shape, its icon and its legend entry; a dashed line or outline is a draft. Every node is focusable, and the
 * same relations are available as a list.
 */
export function Graph({
  nodes,
  edges,
  centerId,
  kinds = {},
  maxDepth = 2,
  depth: depthProp,
  onDepthChange,
  onNodeSelect,
  nodeHref,
  label = "Relations",
  showEdgeLabels = true,
  className,
}: GraphProps) {
  const [depthState, setDepthState] = useState(maxDepth);
  const depth = depthProp ?? depthState;
  const [view, setView] = useState<"graph" | "list">("graph");
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      if (w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);
  const height = Math.round(Math.min(560, Math.max(320, width * 0.7)));

  const hops = useMemo(() => hopsFrom(centerId, edges), [centerId, edges]);
  const shown = useMemo(() => nodes.filter((n) => (hops.get(n.id) ?? Infinity) <= depth), [nodes, hops, depth]);
  const shownIds = useMemo(() => new Set(shown.map((n) => n.id)), [shown]);
  const shownEdges = useMemo(() => edges.filter((e) => shownIds.has(e.source) && shownIds.has(e.target)), [edges, shownIds]);
  const laid = useMemo(() => layoutGraph(shown, shownEdges, centerId, width, height), [shown, shownEdges, centerId, width, height]);
  const at = useMemo(() => new Map(laid.map((n) => [n.id, n])), [laid]);

  const kindKeys = useMemo(() => [...new Set(nodes.map((n) => n.kind))].sort(), [nodes]);
  const shapeOf = (kind: string): Shape => SHAPES[Math.max(0, kindKeys.indexOf(kind)) % SHAPES.length] ?? "circle";
  const kindOf = (kind: string): GraphKind => kinds[kind] ?? { label: kind };
  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  const depthOptions = Array.from({ length: maxDepth }, (_, i) => ({ value: String(i + 1), label: i === 0 ? "1 hop" : `${i + 1} hops` }));
  const choose = (n: GraphNode, e?: MouseEvent | KeyboardEvent) => {
    if (!onNodeSelect) return;
    if (e && "button" in e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e?.preventDefault();
    onNodeSelect(n);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          label="Hops from the centre"
          options={depthOptions}
          value={String(depth)}
          onValueChange={(v) => {
            if (v === null) return;
            setDepthState(Number(v));
            onDepthChange?.(Number(v));
          }}
        />
        <ToggleGroup
          label="View"
          options={[
            { value: "graph", label: "Graph" },
            { value: "list", label: "List" },
          ]}
          value={view}
          onValueChange={(v) => v && setView(v as "graph" | "list")}
        />
      </div>

      {view === "graph" ? (
        <>
          <div ref={box} className="panel w-full overflow-hidden">
            <svg role="group" aria-label={label} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block text-ink">
              {shownEdges.map((e, i) => {
                const a = at.get(e.source);
                const b = at.get(e.target);
                if (!a || !b) return null;
                const text = `${nameOf(e.source)} ${e.label ?? "to"} ${nameOf(e.target)}${e.draft ? ", draft" : ""}`;
                return (
                  <g key={`${e.source}-${e.target}-${i}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeDasharray={e.draft ? "4 3" : undefined} className="stroke-line-strong" strokeWidth={1}>
                      <title>{text}</title>
                    </line>
                    {showEdgeLabels && e.label ? (
                      <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" className="fill-ink-faint" aria-hidden="true">
                        {clip(e.label, 16)}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              {laid.map((n) => {
                const center = n.id === centerId;
                const kind = kindOf(n.kind);
                const r = center ? 16 : 12;
                const Icon = kind.icon;
                const name = `${n.label}, ${kind.label}${n.draft ? ", draft" : ""}${center ? ", centre" : `, ${n.depth} ${n.depth === 1 ? "hop" : "hops"}`}`;
                const body = (
                  <>
                    <path
                      d={shapePath(shapeOf(n.kind), r)}
                      strokeDasharray={n.draft ? "3 2" : undefined}
                      strokeWidth={center ? 2 : 1}
                      className={cn("fill-surface-raised", center ? "stroke-ink" : "stroke-ink-muted", n.draft && "opacity-60")}
                    />
                    {Icon ? (
                      <g className={cn("text-ink-muted", n.draft && "opacity-60")}>
                        <Icon aria-hidden="true" size={center ? 18 : 14} x={center ? -9 : -7} y={center ? -9 : -7} />
                      </g>
                    ) : null}
                    <text y={r + 14} textAnchor="middle" className={cn(n.draft ? "fill-ink-muted" : "fill-ink")} aria-hidden="true">
                      {clip(n.label)}
                    </text>
                  </>
                );
                const common = { className: "cursor-pointer outline-none [&:focus-visible_path]:stroke-[3] [&:hover_path]:stroke-ink", transform: `translate(${n.x} ${n.y})`, "aria-label": name };
                return nodeHref ? (
                  <a key={n.id} href={nodeHref(n)} onClick={(e) => choose(n, e)} {...common}>
                    {body}
                  </a>
                ) : (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => choose(n, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") choose(n, e);
                    }}
                    {...common}
                  >
                    {body}
                  </g>
                );
              })}
            </svg>
          </div>
          <ul aria-label="Legend" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-ink-muted">
            {kindKeys.map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <svg width={20} height={20} viewBox="-12 -12 24 24" aria-hidden="true">
                  <path d={shapePath(shapeOf(k), 8)} className="fill-surface-raised stroke-ink-muted" strokeWidth={1} />
                </svg>
                {kindOf(k).label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <svg width={20} height={20} viewBox="-12 -12 24 24" aria-hidden="true">
                <line x1={-10} y1={0} x2={10} y2={0} strokeDasharray="4 3" className="stroke-ink-muted" strokeWidth={1} />
              </svg>
              Draft
            </li>
          </ul>
        </>
      ) : (
        <ul aria-label={label} className="m-0 flex list-none flex-col divide-y divide-line p-0">
          {[...laid]
            .sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label))
            .map((n) => {
              const rels = shownEdges.filter((e) => e.source === n.id || e.target === n.id);
              const kind = kindOf(n.kind);
              return (
                <li key={n.id} className="flex flex-col gap-1 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {nodeHref ? (
                      <a href={nodeHref(n)} onClick={(e) => choose(n, e)} className={cn("underline-offset-2 hover:underline", n.draft ? "text-ink-muted" : "text-ink")}>
                        {n.label}
                      </a>
                    ) : onNodeSelect ? (
                      <a href="#" onClick={(e) => choose(n, e)} className={cn("underline-offset-2 hover:underline", n.draft ? "text-ink-muted" : "text-ink")}>
                        {n.label}
                      </a>
                    ) : (
                      <span className={n.draft ? "text-ink-muted" : "text-ink"}>{n.label}</span>
                    )}
                    <span className="text-ink-faint">
                      {kind.label}
                      {n.draft ? ", draft" : ""}
                      {n.id === centerId ? ", centre" : `, ${n.depth} ${n.depth === 1 ? "hop" : "hops"}`}
                    </span>
                  </div>
                  {rels.length > 0 ? (
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0 pl-4 text-ink-muted">
                      {rels.map((e, i) => (
                        <li key={i} className={e.draft ? "text-ink-faint" : undefined}>
                          {e.source === n.id ? `${e.label ?? "to"} → ${nameOf(e.target)}` : `${nameOf(e.source)} → ${e.label ?? "to"} this`}
                          {e.draft ? " (draft)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
