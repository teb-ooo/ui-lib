import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { QueryState } from "./query-state";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "QueryState",
  group: "Molecules",
  description:
    "The four states of a data screen over a query result: loading (delayed 100ms), error with Retry (a sentence from describeError, never a raw message), empty (your EmptyState) and loaded (your screen). For a table use DataTable's own loading, error and empty props.",
  aliases: ["loading", "error state", "retry", "query", "data screen", "loading error empty", "skeleton"],
  component: "QueryState",
  source: "src/components/query-state.tsx",
} satisfies StoryDefault;

const rows = ["Ada", "Grace"];

export const Loaded = () => (
  <QueryState query={{ data: rows, error: null, isPending: false }}>{(names) => <ul className="p-4 text-ink">{names.map((n) => <li key={n}>{n}</li>)}</ul>}</QueryState>
);
Loaded.storyMeta = { description: "Data is there: the children draw it." } satisfies StoryMeta;

export const Loading = () => <QueryState query={{ data: undefined, error: null, isPending: true }}>{() => null}</QueryState>;
Loading.storyMeta = { description: "A first load: a quiet line that appears after 100ms.", state: "loading" } satisfies StoryMeta;

export const Failed = () => (
  <QueryState query={{ data: undefined, error: new Error("boom"), isPending: false, refetch: () => undefined }}>{() => null}</QueryState>
);
Failed.storyMeta = { description: "A failed first load: one sentence for a person and Retry.", state: "error" } satisfies StoryMeta;

export const Empty = () => (
  <QueryState
    query={{ data: [] as string[], error: null, isPending: false }}
    empty={<EmptyState title="No notes yet" description="Write the first one." action={<Button intent="solid">New note</Button>} />}
  >
    {() => null}
  </QueryState>
);
Empty.storyMeta = { description: "Loaded but empty: say why, and how to add the first." } satisfies StoryMeta;
