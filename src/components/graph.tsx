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

/** A halo in the panel colour behind text, so a line or another label under it does not cut the letters. */
const halo = (fill: string) => cn(fill, "stroke-surface [paint-order:stroke] [stroke-linejoin:round] [stroke-width:3px]");

const clip = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export interface LaidOutNode extends GraphNode {
  x: number;
  y: number;
  depth: number;
  /** Most characters of the name drawn, from the room on its ring. */
  labelChars?: number;
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

const CHAR = 8.6;
const MAX_CHARS = 18;
const TAU = Math.PI * 2;

/** Circular distance between two angles. */
function angleGap(a: number, b: number): number {
  const d = Math.abs(a - b) % TAU;
  return d > Math.PI ? TAU - d : d;
}

/** Ramanujan's approximation of an ellipse's perimeter. */
function perimeter(rx: number, ry: number): number {
  const h = ((rx - ry) * (rx - ry)) / ((rx + ry) * (rx + ry));
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

export interface RingLayout {
  nodes: LaidOutNode[];
  /** The height the picture needs: it grows with the number of nodes on the busiest ring. */
  height: number;
}

/**
 * Concentric rings, the same picture for the same input: the centre in the middle, hop 1 evenly spaced on the first
 * ring, hop 2 on the next ring ordered by the angle of its hop-1 neighbours (so lines rarely cross), and so on. The rings
 * are ellipses that use the width, grow in height with the node count, and keep every label inside the box.
 */
export function layoutRings(nodes: GraphNode[], edges: GraphEdge[], centerId: string, width: number): RingLayout {
  const hops = hopsFrom(centerId, edges);
  const depthOf = (id: string) => (id === centerId ? 0 : (hops.get(id) ?? 1));
  const rings = new Map<number, GraphNode[]>();
  for (const n of nodes) if (n.id !== centerId) (rings.get(depthOf(n.id)) ?? rings.set(depthOf(n.id), []).get(depthOf(n.id)))?.push(n);
  const maxRing = Math.max(0, ...rings.keys());
  const neighbours = new Map<string, string[]>();
  for (const e of edges) {
    (neighbours.get(e.source) ?? neighbours.set(e.source, []).get(e.source))?.push(e.target);
    (neighbours.get(e.target) ?? neighbours.set(e.target, []).get(e.target))?.push(e.source);
  }

  const half18 = MAX_CHARS * (CHAR / 2) + 4;
  const rxMax = Math.max(60, width / 2 - half18);
  const spacing = 64; // the least room one node and its name need along a ring
  const radii = new Map<number, { rx: number; ry: number }>();
  let previousRy = 0;
  for (let k = 1; k <= maxRing; k++) {
    const count = rings.get(k)?.length ?? 0;
    const rx = Math.min(rxMax, 90 * k + 20);
    let ry = Math.max(previousRy + 64, 64 * k + 16);
    while (perimeter(rx, ry) < count * spacing) ry += 8;
    radii.set(k, { rx, ry });
    previousRy = ry;
  }
  const cx = width / 2;

  const angles = new Map<string, number>();
  interface Pending {
    node: GraphNode;
    k: number;
    angle: number;
    rx: number;
    ry: number;
    chars: number;
  }
  const pending: Pending[] = [];
  for (let k = 1; k <= maxRing; k++) {
    const ring = [...(rings.get(k) ?? [])];
    const n = ring.length;
    if (n === 0) continue;
    // Each node wants the mean angle of the nodes it touches on the inner ring; with none it keeps its input order.
    const wanted = new Map<string, number>();
    ring.forEach((node, i) => {
      const parents = (neighbours.get(node.id) ?? []).map((id) => angles.get(id)).filter((a): a is number => a !== undefined && k > 1);
      const fallback = -Math.PI / 2 + (TAU * i) / n;
      if (parents.length === 0) return void wanted.set(node.id, fallback);
      const x = parents.reduce((sum, a) => sum + Math.cos(a), 0);
      const y = parents.reduce((sum, a) => sum + Math.sin(a), 0);
      wanted.set(node.id, Math.atan2(y, x));
    });
    if (k > 1) ring.sort((a, b) => (((wanted.get(a.id) ?? 0) + TAU) % TAU) - (((wanted.get(b.id) ?? 0) + TAU) % TAU));
    // Evenly spaced, rotated to where the nodes want to be: the rotation with the least total distance.
    let best = -Math.PI / 2;
    if (k > 1) {
      let bestCost = Infinity;
      for (let j = 0; j < n; j++) {
        const phi = (wanted.get(ring[j]?.id ?? "") ?? 0) - (TAU * j) / n;
        const cost = ring.reduce((sum, node, i) => sum + angleGap(wanted.get(node.id) ?? 0, phi + (TAU * i) / n), 0);
        if (cost < bestCost) {
          bestCost = cost;
          best = phi;
        }
      }
    }
    const { rx, ry } = radii.get(k) ?? { rx: rxMax, ry: 64 };
    const arc = perimeter(rx, ry) / n;
    const chars = Math.min(MAX_CHARS, Math.max(8, Math.floor((arc - 10) / CHAR)));
    ring.forEach((node, i) => {
      const angle = best + (TAU * i) / n;
      angles.set(node.id, angle);
      pending.push({ node, k, angle, rx, ry, chars });
    });
  }

  // Place ring by ring against what is already down. A node whose name would land on another node or name steps outward
  // along its ray; if that does not clear it, its name is cut shorter. Positions are relative to the centre until the end.
  type Box = { x: number; y: number; w: number; h: number };
  const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const boxesOf = (x: number, y: number, r: number, label: string, chars: number): Box[] => {
    const w = Math.min(label.length, chars) * CHAR;
    return [
      { x: x - r, y: y - r, w: 2 * r, h: 2 * r },
      { x: x - w / 2 - 2, y: y + r + 1, w: w + 4, h: 19 },
    ];
  };
  const centreNode = nodes.find((n) => n.id === centerId) ?? { id: centerId, label: centerId, kind: "" };
  const taken: Box[] = boxesOf(cx, 0, 16, centreNode.label, MAX_CHARS);
  const finals = new Map<string, { x: number; y: number; chars: number; k: number }>();
  const at = (p: Pending, scale: number, chars: number) => {
    const margin = Math.min(chars, p.node.label.length) * (CHAR / 2) + 4;
    return { x: Math.min(width - margin, Math.max(margin, cx + p.rx * scale * Math.cos(p.angle))), y: p.ry * scale * Math.sin(p.angle), margin };
  };
  for (const p of pending) {
    let chosen: { x: number; y: number; chars: number } | null = null;
    for (let chars = p.chars; chars >= 6 && !chosen; chars -= chars > 12 ? 3 : 2) {
      for (let scale = 1; scale <= 1.7 && !chosen; scale += 0.1) {
        const pos = at(p, scale, chars);
        if (!boxesOf(pos.x, pos.y, 12, p.node.label, chars).some((b) => taken.some((o) => hit(b, o)))) chosen = { x: pos.x, y: pos.y, chars };
      }
    }
    const pos = chosen ?? { ...at(p, 1, 6), chars: 6 };
    finals.set(p.node.id, { x: pos.x, y: pos.y, chars: pos.chars, k: p.k });
    taken.push(...boxesOf(pos.x, pos.y, 12, p.node.label, pos.chars));
  }
  // The picture is as tall as what was placed needs: shift everything so the top has a margin.
  let minY = -34;
  let maxY = 34;
  for (const f of finals.values()) {
    minY = Math.min(minY, f.y - 16);
    maxY = Math.max(maxY, f.y + 36);
  }
  const height = Math.round(Math.max(280, maxY - minY + 24));
  const shift = 12 - minY + Math.max(0, (280 - (maxY - minY + 24)) / 2);
  const placed = new Map<string, LaidOutNode>();
  placed.set(centerId, { ...centreNode, x: cx, y: shift, depth: 0 });
  for (const n of nodes) {
    const f = finals.get(n.id);
    if (f) placed.set(n.id, { ...n, x: f.x, y: f.y + shift, depth: f.k, labelChars: f.chars });
  }
  return { nodes: nodes.map((n) => placed.get(n.id) ?? { ...n, x: cx, y: shift, depth: 1 }), height };
}

/** The positions of `layoutRings` for a box `width` wide; `height` is ignored (the rings decide it). Kept for callers of the earlier layout. */
export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[], centerId: string, width: number, _height?: number): LaidOutNode[] {
  return layoutRings(nodes, edges, centerId, width).nodes;
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

  const hops = useMemo(() => hopsFrom(centerId, edges), [centerId, edges]);
  const shown = useMemo(() => nodes.filter((n) => (hops.get(n.id) ?? Infinity) <= depth), [nodes, hops, depth]);
  const shownIds = useMemo(() => new Set(shown.map((n) => n.id)), [shown]);
  const shownEdges = useMemo(() => edges.filter((e) => shownIds.has(e.source) && shownIds.has(e.target)), [edges, shownIds]);
  const ring = useMemo(() => layoutRings(shown, shownEdges, centerId, width), [shown, shownEdges, centerId, width]);
  const laid = ring.nodes;
  const height = ring.height;
  const at = useMemo(() => new Map(laid.map((n) => [n.id, n])), [laid]);

  // Relation labels sit on their line but step along it, or are dropped clear; one that cannot be placed without landing
  // on a node, a node's name or another label is left out (the line still carries it as a tooltip, and the list view has it).
  const edgeLabelAt = useMemo(() => {
    const char = 8.6;
    type Box = { x: number; y: number; w: number; h: number };
    const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const taken: Box[] = [];
    for (const n of laid) {
      const r = n.id === centerId ? 16 : 12;
      const w = clip(n.label, n.labelChars ?? 18).length * char;
      taken.push({ x: n.x - r, y: n.y - r, w: 2 * r, h: 2 * r }, { x: n.x - w / 2, y: n.y + r + 2, w, h: 17 });
    }
    const out = new Map<number, { x: number; y: number }>();
    shownEdges.forEach((e, i) => {
      const a = at.get(e.source);
      const b = at.get(e.target);
      if (!a || !b || !e.label) return;
      const w = clip(e.label, 16).length * char;
      let chosen: { x: number; y: number; box: Box } | null = null;
      search: for (const dy of [0, -15, 15, -30, 30]) {
        for (const t of [0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75, 0.2, 0.8]) {
          const x = Math.min(width - w / 2 - 2, Math.max(w / 2 + 2, a.x + (b.x - a.x) * t));
          const y = a.y + (b.y - a.y) * t - 3 + dy;
          const box = { x: x - w / 2, y: y - 13, w, h: 17 };
          if (!taken.some((o) => hit(box, o))) {
            chosen = { x, y, box };
            break search;
          }
        }
      }
      if (chosen) {
        taken.push(chosen.box);
        out.set(i, { x: chosen.x, y: chosen.y });
      }
    });
    return out;
  }, [laid, shownEdges, at, centerId, width]);

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
                    {showEdgeLabels && e.label && edgeLabelAt.get(i) ? (
                      <text x={edgeLabelAt.get(i)?.x} y={edgeLabelAt.get(i)?.y} textAnchor="middle" className={halo("fill-ink-faint")} aria-hidden="true">
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
                    <text y={r + 14} textAnchor="middle" className={halo(n.draft ? "fill-ink-muted" : "fill-ink")} aria-hidden="true">
                      {clip(n.label, n.labelChars ?? 18)}
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
