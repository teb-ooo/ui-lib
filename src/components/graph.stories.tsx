import { Castle, MapPin, Swords, User } from "lucide-react";
import { Graph } from "./graph";
import type { GraphEdge, GraphKind, GraphNode } from "./graph";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Graph",
  group: "Molecules",
  description:
    "An ego network: one node in the middle and what it relates to, one or two hops out, on concentric rings (hop 1 evenly spaced, hop 2 beside its hop-1 neighbour; the same input always draws the same picture and the box grows with the node count). Colour is state only, so a node's type is its shape, icon and legend entry; a dashed line is a draft. Nodes are focusable and the same relations are available as a list.",
  aliases: ["network", "node graph", "relations graph", "force layout", "ego network", "knowledge graph", "diagram"],
  component: "Graph",
  source: "src/components/graph.tsx",
} satisfies StoryDefault;

const kinds: Record<string, GraphKind> = {
  character: { label: "Character", icon: User },
  place: { label: "Place", icon: MapPin },
  event: { label: "Event", icon: Swords },
  faction: { label: "Faction", icon: Castle },
};

const nodes: GraphNode[] = [
  { id: "mira", label: "Mira Vance", kind: "character" },
  { id: "orlen", label: "House Orlen", kind: "faction" },
  { id: "mire", label: "Mirewood", kind: "place" },
  { id: "oath", label: "The Miller's Oath", kind: "event", draft: true },
  { id: "tomas", label: "Tomas Reed", kind: "character" },
  { id: "keep", label: "Orlen Keep", kind: "place" },
  { id: "siege", label: "Siege of the Keep", kind: "event" },
];

const edges: GraphEdge[] = [
  { source: "mira", target: "orlen", label: "serves" },
  { source: "mira", target: "mire", label: "born in" },
  { source: "mira", target: "oath", label: "swore", draft: true },
  { source: "mira", target: "tomas", label: "knows" },
  { source: "orlen", target: "keep", label: "holds" },
  { source: "keep", target: "siege", label: "site of" },
  { source: "tomas", target: "siege", label: "fought in" },
];

export const EgoNetwork = () => <Graph nodes={nodes} edges={edges} centerId="mira" kinds={kinds} label="Relations of Mira Vance" onNodeSelect={() => undefined} />;
EgoNetwork.storyMeta = { description: "Two hops from the centre; switch to one hop or to the list." } satisfies StoryMeta;

export const OneHop = () => <Graph nodes={nodes} edges={edges} centerId="mira" kinds={kinds} depth={1} label="Relations of Mira Vance" />;
OneHop.storyMeta = { description: "depth=1 shows direct relations only." } satisfies StoryMeta;

const busyNodes: GraphNode[] = [
  { id: "coast", label: "The Saltmere Coast", kind: "place" },
  ...["Harbour of Reeds", "Captain Ilsa Marr", "The Drowned Bell", "Saltmere Guild", "Gull Rock", "Tomas Reed", "Ferry of Ash"].map((label, i) => ({
    id: `a${i}`,
    label,
    kind: (["place", "character", "event", "faction", "place", "character", "event"] as const)[i] ?? "place",
  })),
  ...["Lighthouse Keepers", "Old Fish Market", "The Pale Tide", "Brine Smugglers", "Marr's Ledger", "Reed Family"].map((label, i) => ({
    id: `b${i}`,
    label,
    kind: (["faction", "place", "event", "faction", "event", "faction"] as const)[i] ?? "place",
  })),
];
const busyEdges: GraphEdge[] = [
  ...busyNodes.slice(1, 8).map((n) => ({ source: "coast", target: n.id, label: "relates" })),
  { source: "a1", target: "b0" },
  { source: "a0", target: "b1" },
  { source: "a2", target: "b2" },
  { source: "a3", target: "b3", draft: true },
  { source: "a1", target: "b4" },
  { source: "a5", target: "b5" },
  { source: "a4", target: "b0" },
];

export const Busy = () => <Graph nodes={busyNodes} edges={busyEdges} centerId="coast" kinds={kinds} label="Relations of The Saltmere Coast" showEdgeLabels={false} />;
Busy.storyMeta = { description: "Fourteen nodes, two hops: concentric rings, hop 2 near its hop-1 neighbour, the picture grows in height, names are cut to fit their ring." } satisfies StoryMeta;
