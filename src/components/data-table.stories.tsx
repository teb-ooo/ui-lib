import { useMemo, useState } from "react";
import { Chip } from "./chip";
import { DataTable } from "./data-table";
import { StatusMark } from "./status-mark";
import type { MarkStatus } from "./status-mark";
import type { Column, Sort } from "./data-table";
import type { ChipTone } from "./chip";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "DataTable",
  group: "Molecules",
  description:
    "A dense, keyboard-driven table for many rows: sticky header, sortable columns, column menu, checkbox selection, an active row that can drive a detail pane, cursor paging and windowing past 100 rows. Below a breakpoint it can show cards. It fills its parent's height and scrolls inside it. Click the table, then use the arrow keys, Home, End, Enter and Space.",
  aliases: ["table", "grid", "data grid", "datagrid", "list", "rows", "spreadsheet", "sortable", "pagination", "virtual list"],
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

function Demo({
  count = 30,
  selectable = false,
  menu = false,
  cards = false,
}: {
  count?: number;
  selectable?: boolean;
  menu?: boolean;
  cards?: boolean;
}) {
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
Default.storyMeta = {
  description: "Sort by a header; the active row keeps its highlight through a re-sort. Columns drop out on narrower screens.",
} satisfies StoryMeta;

export const Selectable = () => <Demo selectable />;
Selectable.storyMeta = {
  description:
    "A checkbox column with select all. Shift+click a second checkbox to select the range; Space toggles the active row, Shift+Space and Shift+Up/Down extend the selection.",
} satisfies StoryMeta;

export const ColumnMenu = () => <Demo menu />;
ColumnMenu.storyMeta = { description: "Giving onColumnVisibilityChange adds a Columns menu; the app keeps the state." } satisfies StoryMeta;

export const Paginated = () => {
  const total = 3455;
  const [page, setPage] = useState(0);
  const pageSize = 100;
  const rows = useMemo(() => makeItems(Math.max(0, Math.min(pageSize, total - page * pageSize)), page * pageSize), [page, pageSize]);
  return (
    <div className="h-96">
      <DataTable
        label="Tasks"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};
Paginated.storyMeta = {
  description:
    'pagination: the table shows the page it is given and a footer says "1-100 of 3455" (the server\'s total) with Previous and Next (the app chooses the page size, so there is no rows-per-page select). Alt+PageUp and Alt+PageDown change page. totalIsLowerBound shows "500+".',
} satisfies StoryMeta;

export const PaginatedBleed = () => {
  const [page, setPage] = useState(0);
  return (
    <div className="h-72">
      <DataTable
        label="Tasks"
        columns={columns}
        rows={makeItems(25, page * 25)}
        rowKey={(r) => r.id}
        bleed
        renderCard={card}
        pagination={{ page, pageSize: 25, total: 500, totalIsLowerBound: true, onPageChange: setPage }}
      />
    </div>
  );
};
PaginatedBleed.storyMeta = {
  description:
    'With bleed the footer has the same edge-to-edge rule and inset as the cells; on a phone the cards get the same footer; "500+" marks a lower-bound total.',
} satisfies StoryMeta;

export const ResizableColumns = () => (
  <div className="h-72">
    <DataTable
      label="Tasks"
      columns={columns.map((c) => (c.id === "priority" ? { ...c, resizable: false } : c))}
      rows={makeItems(12)}
      rowKey={(r) => r.id}
      resizable
      persistKey="gallery-resizable"
      columnMenu={false}
    />
  </div>
);
ResizableColumns.storyMeta = {
  description:
    "resizable: drag the right edge of a header, or focus it and press Left and Right (Home or a double-click resets). Widths are remembered with persistKey; columnMenu={false} saves them without the Columns menu. The P column opts out.",
} satisfies StoryMeta;

export const RemembersColumns = () => (
  <div className="h-72">
    <DataTable label="Tasks" columns={columns} rows={makeItems(12)} rowKey={(r) => r.id} persistKey="gallery-tasks" />
  </div>
);
RemembersColumns.storyMeta = {
  description: "With persistKey the table remembers which columns are shown in this browser: hide one in the Columns menu, then reload.",
} satisfies StoryMeta;

export const Bleed = () => {
  const [active, setActive] = useState<string | null>("item-2");
  return (
    <div className="h-72">
      <DataTable label="Tasks" columns={columns} rows={makeItems(20)} rowKey={(r) => r.id} activeKey={active} onActiveKeyChange={setActive} bleed />
    </div>
  );
};
Bleed.storyMeta = {
  description: "bleed: no frame; the header rule and row dividers run edge to edge. Use it when the table is the page.",
} satisfies StoryMeta;

export const NarrowPane = () => (
  <div className="h-60 w-80 max-w-full">
    <DataTable label="Tasks" columns={columns} rows={makeItems(12)} rowKey={(r) => r.id} persistKey="gallery-narrow" />
  </div>
);
NarrowPane.storyMeta = {
  description:
    "hideBelow follows the table's own width: in this narrow box the status and owner columns drop out by themselves, and the Columns menu says how many are hidden.",
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

export const FitToRows = () => (
  <div className="flex h-72 flex-col gap-2 border border-line p-2">
    <p className="text-ink-muted">A short list: the table is only as tall as its rows.</p>
    <DataTable label="Short list" fit rows={makeItems(3)} rowKey={(r) => r.id} columns={columns} />
    <p className="text-ink-muted">Below it, more content.</p>
  </div>
);
FitToRows.storyMeta = { description: "`fit`: only as tall as its header and rows; with many rows it shrinks to the space left and scrolls inside itself." } satisfies StoryMeta;

export const WrappedLines = () => {
  const rows = makeItems(6).map((r) => ({ ...r, title: `${r.title}. ${"A sentence that goes on to explain what this task is about and why it matters, ".repeat(2)}` }));
  const wrapped: Column<Item>[] = [
    { id: "id", header: "Id", cell: (r) => r.id, width: "7rem" },
    { id: "title", header: "Title", cell: (r) => r.title, width: "1fr", lines: 2 },
  ];
  return (
    <div className="h-80">
      <DataTable label="Sentences" rows={rows} rowKey={(r) => r.id} columns={wrapped} />
    </div>
  );
};
WrappedLines.storyMeta = { description: "`lines: 2` on a column lets a long sentence take two lines (then an ellipsis) and the row grows to fit." } satisfies StoryMeta;

// A matrix: a row per run, a column per check. The set of checks comes from the server, so the columns are built from it.
const CHECKS = ["Backups", "Certificates", "Disk space", "DNS", "Identity", "Live stream", "Logs", "Mail", "Memory", "Migrations", "Passkeys", "Queue", "Search", "Secrets", "Sessions", "Storage", "Uptime"];
interface Run {
  id: string;
  time: string;
  trigger: string;
  result: string;
  marks: MarkStatus[];
}
const RUNS: Run[] = Array.from({ length: 30 }, (_, i) => {
  const marks = CHECKS.map((_, c): MarkStatus => ((i * 7 + c * 3) % 23 === 0 ? "fail" : (i + c) % 11 === 0 ? "info" : (i * 5 + c) % 13 === 0 ? "none" : "ok"));
  return { id: `run-${i + 1}`, time: `2026-10-0${(i % 7) + 1} ${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`, trigger: ["schedule", "deploy", "manual"][i % 3] as string, result: marks.includes("fail") ? "failed" : "passed", marks };
});
const matrixColumns: Column<Run>[] = [
  { id: "time", header: "Time", width: "10rem", cell: (r) => r.time },
  { id: "trigger", header: "Trigger", width: "6rem", hideBelow: "md", cell: (r) => r.trigger },
  ...CHECKS.map(
    (name, c): Column<Run> => ({ id: `check-${c}`, header: name, width: "2.5rem", align: "center", rotate: true, hideable: false, cell: (r) => <StatusMark status={r.marks[c] ?? "none"} label={`${name}: ${r.marks[c] === "fail" ? "failed" : r.marks[c] === "info" ? "info" : r.marks[c] === "none" ? "not run" : "ok"}`} /> }),
  ),
  { id: "result", header: "Result", width: "6rem", cell: (r) => <Chip tone={r.result === "failed" ? "danger" : "ok"}>{r.result}</Chip> },
];

export const Matrix = () => {
  const [active, setActive] = useState<string | null>("run-2");
  return (
    <div className="h-96 w-full">
      <DataTable
        label="Runs by check"
        columns={matrixColumns}
        rows={RUNS}
        rowKey={(r) => r.id}
        activeKey={active}
        onActiveKeyChange={setActive}
        renderCard={(r) => (
          <div className="flex flex-col gap-1">
            <span className="flex items-center justify-between gap-2">
              <span className="text-ink">{r.time}</span>
              <Chip tone={r.result === "failed" ? "danger" : "ok"}>{r.result}</Chip>
            </span>
            <span className="text-ink-muted">{r.trigger}</span>
            <span className="flex flex-wrap gap-1">
              {r.marks.map((m, c) => (m === "ok" ? null : <StatusMark key={CHECKS[c]} status={m} label={`${CHECKS[c]}: ${m === "fail" ? "failed" : m === "info" ? "info" : "not run"}`} />))}
            </span>
          </div>
        )}
      />
    </div>
  );
};
Matrix.storyMeta = { description: "A run per row and a check per column (the checks come from the server): columns of width 2.5rem, align center and rotate, so the header names rise at 45 degrees and the full name shows on hover or focus; each cell is a StatusMark with an accessible name. The first and last columns stay normal; the table scrolls sideways inside its pane, keeps the keyboard row selection, and below the md breakpoint shows cards that list only the marks that are not ok." } satisfies StoryMeta;
