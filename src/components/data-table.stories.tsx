import { useMemo, useState } from "react";
import { Chip } from "./chip";
import { DataTable } from "./data-table";
import type { Column, Sort } from "./data-table";
import type { ChipTone } from "./chip";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "DataTable",
  group: "Molecules",
  description:
    "A dense, keyboard-driven table for many rows: sticky header, sortable columns, column menu, checkbox selection, an active row that can drive a detail pane, cursor paging and windowing past 100 rows. Below a breakpoint it can show cards. It fills its parent's height and scrolls inside it. Click the table, then use the arrow keys, Home, End, Enter and Space.",
  component: "DataTable",
  source: "src/components/data-table.tsx",
} satisfies StoryDefault;

interface Item {
  id: string;
  title: string;
  status: "open" | "in progress" | "closed";
  owner: string;
  priority: number;
}

const statuses = ["open", "in progress", "closed"] as const;
const owners = ["ada", "grace", "linus", "margaret"];
const tone: Record<Item["status"], ChipTone> = { open: "default", "in progress": "link", closed: "muted" };

function makeItems(n: number, offset = 0): Item[] {
  return Array.from({ length: n }, (_, i) => {
    const k = i + offset;
    return {
      id: `item-${k + 1}`,
      title: `Task ${k + 1}: ${["Fix the redirect", "Write the docs", "Upgrade a package", "Review the design"][k % 4]}`,
      status: statuses[k % 3] as Item["status"],
      owner: owners[k % 4] as string,
      priority: (k % 4) + 1,
    };
  });
}

const columns: Column<Item>[] = [
  { id: "id", header: "Id", cell: (r) => <span className="text-ink-muted">{r.id}</span>, sortable: true, width: "7rem" },
  { id: "title", header: "Title", cell: (r) => r.title, sortable: true, width: "3fr" },
  { id: "status", header: "Status", cell: (r) => <Chip tone={tone[r.status]}>{r.status}</Chip>, sortable: true, width: "9rem", hideBelow: "sm" },
  { id: "owner", header: "Owner", cell: (r) => r.owner, sortable: true, width: "8rem", hideBelow: "md" },
  { id: "priority", header: "P", cell: (r) => `P${r.priority}`, sortable: true, width: "4rem", align: "end" },
];

function sortItems(items: Item[], sort: Sort | null): Item[] {
  if (!sort) return items;
  const key = sort.columnId as keyof Item;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * dir);
}

const card = (r: Item) => (
  <div className="flex h-12 flex-col justify-center">
    <span className="truncate text-ink">{r.title}</span>
    <span className="text-ink-faint">
      {r.id} · {r.status} · {r.owner} · P{r.priority}
    </span>
  </div>
);

function Demo({ count = 30, selectable = false, menu = false, cards = false }: { count?: number; selectable?: boolean; menu?: boolean; cards?: boolean }) {
  const [sort, setSort] = useState<Sort | null>(null);
  const [active, setActive] = useState<string | null>("item-2");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const items = useMemo(() => makeItems(count), [count]);
  const rows = useMemo(() => sortItems(items, sort), [items, sort]);
  return (
    <div className="h-96">
      <DataTable
        label="Tasks"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        sort={sort}
        onSortChange={setSort}
        activeKey={active}
        onActiveKeyChange={setActive}
        {...(selectable ? { selectedKeys: selected, onSelectedKeysChange: setSelected } : {})}
        {...(menu ? { columnVisibility: visibility, onColumnVisibilityChange: setVisibility } : {})}
        {...(cards ? { renderCard: card } : {})}
      />
    </div>
  );
}

export const Default = () => <Demo />;
Default.storyMeta = { description: "Sort by a header; the active row keeps its highlight through a re-sort. Columns drop out on narrower screens." } satisfies StoryMeta;

export const Selectable = () => <Demo selectable />;
Selectable.storyMeta = { description: "A checkbox column with select all; Space toggles the active row." } satisfies StoryMeta;

export const ColumnMenu = () => <Demo menu />;
ColumnMenu.storyMeta = { description: "Giving onColumnVisibilityChange adds a Columns menu; the app keeps the state." } satisfies StoryMeta;

export const RemembersColumns = () => (
  <div className="h-72">
    <DataTable label="Tasks" columns={columns} rows={makeItems(12)} rowKey={(r) => r.id} persistKey="gallery-tasks" />
  </div>
);
RemembersColumns.storyMeta = {
  description: "With persistKey the table remembers which columns are shown in this browser: hide one in the Columns menu, then reload.",
} satisfies StoryMeta;

export const Thousands = () => <Demo count={5000} />;
Thousands.storyMeta = { description: "5,000 rows; only the visible rows are in the page." } satisfies StoryMeta;

export const CardsOnPhone = () => <Demo cards />;
CardsOnPhone.storyMeta = { description: "With renderCard, below the md breakpoint the table becomes a list of cards." } satisfies StoryMeta;

export const CursorPaging = () => {
  const [rows, setRows] = useState(() => makeItems(40));
  const [loading, setLoading] = useState(false);
  return (
    <div className="h-72">
      <DataTable
        label="Tasks"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        hasMore={rows.length < 120}
        onLoadMore={() => {
          setLoading(true);
          window.setTimeout(() => {
            setRows((r) => [...r, ...makeItems(40, r.length)]);
            setLoading(false);
          }, 400);
        }}
      />
    </div>
  );
};
CursorPaging.storyMeta = { description: "Scroll to the end: onLoadMore is called and the next 40 rows arrive, up to 120." } satisfies StoryMeta;

export const Loading = () => (
  <div className="h-48">
    <DataTable label="Tasks" columns={columns} rows={[]} rowKey={(r) => r.id} loading />
  </div>
);
Loading.storyMeta = { state: "loading" } satisfies StoryMeta;

export const Empty = () => (
  <div className="h-48">
    <DataTable label="Tasks" columns={columns} rows={[]} rowKey={(r) => r.id} empty="No tasks match these filters." />
  </div>
);

export const ErrorState = () => (
  <div className="h-48">
    <DataTable label="Tasks" columns={columns} rows={[]} rowKey={(r) => r.id} error="The tasks could not be loaded." />
  </div>
);
ErrorState.storyMeta = { state: "error" } satisfies StoryMeta;
