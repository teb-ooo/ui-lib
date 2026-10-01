import { Castle, MapPin, Swords, User } from "lucide-react";
import { Graph } from "./graph";
import type { GraphEdge, GraphKind, GraphNode } from "./graph";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Graph",
  group: "Molecules",
  description:
    "An ego network: one node in the middle and what it relates to, one or two hops out. Colour is state only, so a node's type is its shape, icon and legend entry; a dashed line is a draft. Nodes are focusable and the same relations are available as a list.",
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
