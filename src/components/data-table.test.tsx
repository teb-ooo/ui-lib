import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { DataTable } from "./data-table";
import { EmptyState } from "./empty-state";
import { useState } from "react";
import type { Column } from "./data-table";

interface Row {
  id: string;
  name: string;
}
const columns: Column<Row>[] = [
  { id: "id", header: "Id", cell: (r) => r.id, sortable: true, width: "6rem" },
  { id: "name", header: "Name", cell: (r) => r.name },
];
const rows: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];
const base = { columns, rows, rowKey: (r: Row) => r.id, label: "Things" };

describe("DataTable column configuration", () => {
  it("restores the saved columns, saves a change from the Columns menu, and ignores unusable storage", async () => {
    window.localStorage.setItem("teb-ui:data-table:t", JSON.stringify({ name: false }));
    const { unmount } = render(<DataTable {...base} persistKey="t" />);
    expect(screen.queryByRole("columnheader", { name: /Name/ })).toBeNull();
    expect(screen.getByRole("columnheader", { name: /Id/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    fireEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Name" }));
    expect(JSON.parse(window.localStorage.getItem("teb-ui:data-table:t") ?? "null")).toEqual({ name: true });
    unmount();
    window.localStorage.setItem("teb-ui:data-table:t", "not json");
    render(<DataTable {...base} persistKey="t" />);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeTruthy();
  });

  it("without persistKey nothing is stored, and a controlled columnVisibility wins over the saved one", () => {
    window.localStorage.clear();
    render(<DataTable {...base} columnVisibility={{ id: false }} onColumnVisibilityChange={() => undefined} />);
    expect(screen.queryByRole("columnheader", { name: /Id/ })).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});

describe("DataTable range selection", () => {
  const many: Row[] = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, name: id.toUpperCase() }));
  let latest: ReadonlySet<string> = new Set();
  function Controlled({ initial = [] as string[], list = many, activeKey }: { initial?: string[]; list?: Row[]; activeKey?: string }) {
    const [sel, setSel] = useState<ReadonlySet<string>>(new Set(initial));
    const [active, setActive] = useState<string | null>(activeKey ?? null);
    // eslint-disable-next-line react/globals -- a test double records the latest selection
    latest = sel;
    return <DataTable {...base} rows={list} selectedKeys={sel} onSelectedKeysChange={setSel} activeKey={active} onActiveKeyChange={setActive} />;
  }
  const boxes = () => screen.getAllByRole("checkbox", { name: "Select row" });
  const keys = () => [...latest].sort().join("");

  it("shift+click selects the rows between the anchor and the clicked row", () => {
    render(<Controlled />);
    fireEvent.click(boxes()[1] as HTMLElement);
    fireEvent.click(boxes()[4] as HTMLElement, { shiftKey: true });
    expect(keys()).toBe("bcde");
  });

  it("shift+click takes the anchor's state: an unchecked anchor removes the range", () => {
    render(<Controlled initial={["a", "b", "c", "d", "e", "f"]} />);
    fireEvent.click(boxes()[1] as HTMLElement); // uncheck b: it is the anchor
    fireEvent.click(boxes()[3] as HTMLElement, { shiftKey: true });
    expect(keys()).toBe("aef");
  });

  it("a plain click toggles only that row and moves the anchor", () => {
    render(<Controlled />);
    fireEvent.click(boxes()[0] as HTMLElement);
    fireEvent.click(boxes()[2] as HTMLElement);
    expect(keys()).toBe("ac");
    fireEvent.click(boxes()[4] as HTMLElement, { shiftKey: true });
    expect(keys()).toBe("acde");
  });

  it("shift+click does not start a text selection", () => {
    render(<Controlled />);
    const cell = (boxes()[0] as HTMLElement).closest("[role=gridcell]") as HTMLElement;
    expect(fireEvent.mouseDown(cell, { shiftKey: true })).toBe(false);
    expect(fireEvent.mouseDown(cell)).toBe(true);
  });

  it("shift+Down extends from the active row and shift+Up shrinks it back", () => {
    render(<Controlled activeKey="b" />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown", shiftKey: true });
    fireEvent.keyDown(grid, { key: "ArrowDown", shiftKey: true });
    expect(keys()).toBe("bcd");
    fireEvent.keyDown(grid, { key: "ArrowUp", shiftKey: true });
    expect(keys()).toBe("bc");
  });

  it("shift+Space selects from the anchor to the active row", () => {
    render(<Controlled activeKey="e" />);
    fireEvent.click(boxes()[1] as HTMLElement);
    fireEvent.keyDown(screen.getByRole("grid"), { key: " ", shiftKey: true });
    expect(keys()).toBe("bcde");
  });

  it("the header checkbox selects and clears this page's rows only, and the selection survives a refetch", () => {
    const { rerender } = render(<Controlled initial={["x", "a"]} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(keys()).toBe("abcdefx");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(keys()).toBe("x");
    rerender(<Controlled initial={["x"]} list={[...many].reverse()} />);
    expect(keys()).toBe("x");
  });
});

describe("DataTable pagination", () => {
  const page = (p: Partial<NonNullable<React.ComponentProps<typeof DataTable<Row>>["pagination"]>> = {}) => ({
    page: 0,
    pageSize: 3,
    total: 7,
    onPageChange: vi.fn(),
    ...p,
  });

  it("shows the range of the page out of the server's total, and a plus for a lower bound", () => {
    const { rerender } = render(<DataTable {...base} pagination={page()} />);
    expect(screen.getByRole("navigation", { name: "Pagination" }).textContent).toContain("1-3 of 7");
    rerender(<DataTable {...base} rows={[rows[0] as Row]} pagination={page({ page: 2 })} />);
    expect(screen.getByRole("navigation", { name: "Pagination" }).textContent).toContain("7-7 of 7");
    rerender(<DataTable {...base} pagination={page({ total: 500, totalIsLowerBound: true })} />);
    expect(screen.getByRole("navigation", { name: "Pagination" }).textContent).toContain("1-3 of 500+");
    rerender(<DataTable {...base} rows={[]} pagination={page({ total: 0 })} empty="None" />);
    expect(screen.getByRole("navigation", { name: "Pagination" }).textContent).toContain("0 of 0");
  });

  it("Previous and Next change page and are disabled at the ends", () => {
    const first = page();
    const { rerender } = render(<DataTable {...base} pagination={first} />);
    expect(screen.getByRole("button", { name: "Previous page" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(first.onPageChange).toHaveBeenCalledWith(1);
    const lastP = page({ page: 2 });
    rerender(<DataTable {...base} pagination={lastP} />);
    expect(screen.getByRole("button", { name: "Next page" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(lastP.onPageChange).toHaveBeenCalledWith(1);
  });

  it("with a lower-bound total Next stays on while a full page came back", () => {
    const p = page({ page: 1, total: 6, totalIsLowerBound: true });
    const { rerender } = render(<DataTable {...base} pagination={p} />);
    expect(screen.getByRole("button", { name: "Next page" }).hasAttribute("disabled")).toBe(false);
    rerender(<DataTable {...base} rows={[rows[0] as Row]} pagination={p} />);
    expect(screen.getByRole("button", { name: "Next page" }).hasAttribute("disabled")).toBe(true);
  });

  it("Alt+PageDown and Alt+PageUp change page, plain PageDown still moves rows, and onLoadMore is not called", () => {
    const p = page({ page: 1 });
    const onLoadMore = vi.fn();
    const onActiveKeyChange = vi.fn();
    render(<DataTable {...base} pagination={p} hasMore onLoadMore={onLoadMore} activeKey="a" onActiveKeyChange={onActiveKeyChange} />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "PageDown", altKey: true });
    expect(p.onPageChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(grid, { key: "PageUp", altKey: true });
    expect(p.onPageChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(grid, { key: "PageDown" });
    expect(onActiveKeyChange).toHaveBeenCalled();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("offers a rows-per-page select when page sizes are given", () => {
    render(<DataTable {...base} pagination={page({ pageSizes: [25, 50, 100], onPageSizeChange: () => undefined })} />);
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeTruthy();
  });
});

describe("DataTable resizable columns", () => {
  const widthOf = () => (screen.getAllByRole("row")[0] as HTMLElement).style.gridTemplateColumns;
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 200 });
  });
  afterEach(() => {
    delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth;
  });

  it("no handles unless resizable, and a column can opt out", () => {
    const { rerender } = render(<DataTable {...base} />);
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
    rerender(<DataTable {...base} resizable columns={[columns[0] as Column<Row>, { ...(columns[1] as Column<Row>), resizable: false }]} />);
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });

  it("dragging a handle sets that column's width in pixels, with a minimum, and does not sort", () => {
    const onSortChange = vi.fn();
    render(<DataTable {...base} resizable onSortChange={onSortChange} persistKey="rz" columnMenu={false} />);
    const handle = screen.getByRole("separator", { name: "Resize Id" });
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 150, pointerId: 1 });
    expect(widthOf()).toContain("250px");
    fireEvent.pointerMove(handle, { clientX: -500, pointerId: 1 });
    expect(widthOf()).toContain("64px");
    fireEvent.pointerUp(handle, { pointerId: 1 });
    fireEvent.click(handle);
    expect(onSortChange).not.toHaveBeenCalled();
    expect(JSON.parse(window.localStorage.getItem("teb-ui:data-table:rz:widths") ?? "null")).toEqual({ id: 64 });
    expect(screen.queryByRole("button", { name: "Columns" })).toBeNull();
  });

  it("restores saved widths, nudges with the arrow keys and resets with Home and a double-click", () => {
    window.localStorage.setItem("teb-ui:data-table:rz2:widths", JSON.stringify({ id: 120 }));
    render(<DataTable {...base} resizable persistKey="rz2" />);
    expect(widthOf()).toContain("120px");
    const handle = screen.getByRole("separator", { name: "Resize Id" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(widthOf()).toContain("216px");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(widthOf()).not.toContain("px ");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(widthOf()).toContain("184px");
    fireEvent.doubleClick(handle);
    expect(JSON.parse(window.localStorage.getItem("teb-ui:data-table:rz2:widths") ?? "null")).toEqual({});
  });
});

describe("DataTable header row", () => {
  it("the Columns button is in the header row, not above the table", () => {
    render(<DataTable {...base} persistKey="hdr" />);
    const header = screen.getAllByRole("row")[0] as HTMLElement;
    expect(header.contains(screen.getByRole("button", { name: "Columns" }))).toBe(true);
    // every body row has one extra empty cell so the tracks line up
    const body = screen.getAllByRole("row")[1] as HTMLElement;
    expect(body.querySelectorAll("[role=gridcell]").length).toBe(columns.length + 1);
  });
  it("bleed insets the first and last cell from the edges", () => {
    render(<DataTable {...base} bleed />);
    expect((screen.getAllByRole("row")[0] as HTMLElement).className).toContain("px-2");
    expect((screen.getAllByRole("row")[1] as HTMLElement).className).toContain("px-2");
  });
});

describe("DataTable bleed and width", () => {
  it("bleed removes the frame", () => {
    const { rerender } = render(<DataTable {...base} />);
    expect(screen.getByRole("grid").className).toContain("panel");
    rerender(<DataTable {...base} bleed />);
    expect(screen.getByRole("grid").className).not.toContain("panel");
  });
  it("hideBelow follows the table's width, not the screen's", () => {
    const wide: Column<Row>[] = [...columns, { id: "extra", header: "Extra", cell: () => "x", hideBelow: "md" }];
    const { rerender } = render(<DataTable {...base} columns={wide} />);
    // jsdom has no layout: the table assumes a wide default until measured, so the column shows.
    expect(screen.getByRole("columnheader", { name: /Extra/ })).toBeTruthy();
    rerender(<DataTable {...base} columns={wide} columnVisibility={{ extra: false }} />);
    expect(screen.queryByRole("columnheader", { name: /Extra/ })).toBeNull();
  });
});

describe("DataTable row affordance", () => {
  const rowOf = (name: string) => screen.getByText(name).closest("[role=row]") as HTMLElement;
  it("clickable rows show a pointer and a hover state; plain rows do not get the pointer", () => {
    const { unmount } = render(<DataTable {...base} onRowClick={() => undefined} />);
    expect(rowOf("Beta").className).toContain("cursor-pointer");
    expect(rowOf("Beta").className).toContain("hover:bg-surface-raised");
    unmount();
    render(<DataTable {...base} />);
    expect(rowOf("Beta").className).toContain("cursor-default");
    expect(rowOf("Beta").className).not.toContain("cursor-pointer");
  });
  it("the active row is marked apart from hover", () => {
    render(<DataTable {...base} activeKey="b" onRowClick={() => undefined} />);
    expect(rowOf("Beta").className.split(" ")).toContain("invert");
    expect(rowOf("Alpha").className.split(" ")).not.toContain("invert");
  });
});

describe("DataTable", () => {
  it("renders the header and one row per item", () => {
    render(<DataTable {...base} />);
    expect(screen.getByRole("grid", { name: "Things" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("cycles a sortable header through ascending, descending and none", () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<DataTable {...base} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Id" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "id", direction: "asc" });
    rerender(<DataTable {...base} sort={{ columnId: "id", direction: "asc" }} onSortChange={onSortChange} />);
    expect(screen.getByRole("columnheader", { name: /Id/ }).getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(screen.getByRole("button", { name: "Id" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "id", direction: "desc" });
    rerender(<DataTable {...base} sort={{ columnId: "id", direction: "desc" }} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Id" }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
  });

  it("moves the active row with the arrow keys and opens it with Enter", () => {
    const onActiveKeyChange = vi.fn();
    const onRowClick = vi.fn();
    render(<DataTable {...base} activeKey="a" onActiveKeyChange={onActiveKeyChange} onRowClick={onRowClick} />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(onActiveKeyChange).toHaveBeenLastCalledWith("b");
    fireEvent.keyDown(grid, { key: "End" });
    expect(onActiveKeyChange).toHaveBeenLastCalledWith("c");
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("keeps the active row highlighted when the rows are reordered", () => {
    const { rerender } = render(<DataTable {...base} activeKey="b" />);
    rerender(<DataTable {...base} rows={[...rows].reverse()} activeKey="b" />);
    const selected = screen.getAllByRole("row").filter((r) => r.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain("Beta");
  });

  it("selects rows with the checkboxes and with Space, and all with the header checkbox", () => {
    const onSelectedKeysChange = vi.fn();
    render(<DataTable {...base} activeKey="b" selectedKeys={new Set(["a"])} onSelectedKeysChange={onSelectedKeysChange} />);
    fireEvent.keyDown(screen.getByRole("grid"), { key: " " });
    expect(Array.from(onSelectedKeysChange.mock.lastCall?.[0] as Set<string>).sort()).toEqual(["a", "b"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(Array.from(onSelectedKeysChange.mock.lastCall?.[0] as Set<string>).sort()).toEqual(["a", "b", "c"]);
  });

  it("windows thousands of rows", () => {
    const many = Array.from({ length: 5000 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }));
    render(<DataTable {...base} rows={many} />);
    const rendered = screen.getAllByRole("row").length;
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(120);
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("5001");
  });

  it("shows the empty, loading and error states", () => {
    const { rerender } = render(<DataTable {...base} rows={[]} empty="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    rerender(<DataTable {...base} rows={[]} loading />);
    expect(screen.getByRole("grid").getAttribute("aria-busy")).toBe("true");
    rerender(<DataTable {...base} rows={[]} error="It broke" />);
    expect(screen.getByRole("alert").textContent).toBe("It broke");
  });

  it("asks for more rows when the end is in view", () => {
    const onLoadMore = vi.fn();
    render(<DataTable {...base} hasMore onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalled();
    onLoadMore.mockClear();
    render(<DataTable {...base} hasMore={false} onLoadMore={onLoadMore} />);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("shows the table instead of cards at and above the breakpoint", () => {
    render(<DataTable {...base} renderCard={(r) => <span>card {r.name}</span>} />);
    expect(screen.getByRole("grid", { name: "Things" })).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows cards instead of the table below the breakpoint", () => {
    setViewportWidth(390);
    render(<DataTable {...base} renderCard={(r) => <span>card {r.name}</span>} />);
    expect(screen.getByRole("listbox", { name: "Things" })).toBeTruthy();
    expect(screen.getByText("card Beta")).toBeTruthy();
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("gives cards a checkbox and a select-all row when the table is selectable", () => {
    setViewportWidth(390);
    const onSelectedKeysChange = vi.fn();
    render(<DataTable {...base} selectedKeys={new Set()} onSelectedKeysChange={onSelectedKeysChange} renderCard={(r) => <span>card {r.name}</span>} />);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[1]!);
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(new Set(["b"]));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onSelectedKeysChange).toHaveBeenLastCalledWith(new Set(["a", "b", "c"]));
  });

  it("offers a Retry button with an error when given onRetry", () => {
    const onRetry = vi.fn();
    render(<DataTable {...base} rows={[]} error="It broke" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hasNext decides Next for a cursor list, even when the last page is exactly full", () => {
    const onPageChange = vi.fn();
    const pagination = { page: 0, pageSize: 3, total: 3, totalIsLowerBound: false, hasNext: false, onPageChange };
    const { rerender } = render(<DataTable {...base} pagination={pagination} />);
    const next = screen.getByRole("button", { name: /next/i });
    expect((next as HTMLButtonElement).disabled).toBe(true);
    rerender(<DataTable {...base} pagination={{ ...pagination, total: 3, totalIsLowerBound: true, hasNext: true }} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

describe("DataTable empty", () => {
  it("pads a text `empty` once and does not add padding around an EmptyState", () => {
    const { container, rerender } = render(<DataTable {...base} rows={[]} empty="Nothing here" />);
    expect(screen.getByText("Nothing here").className).toContain("px-2");
    rerender(<DataTable {...base} rows={[]} empty={<EmptyState title="No rows" description="Clear the filter." />} />);
    const status = screen.getByText("No rows").closest('[role="status"]') as HTMLElement;
    expect(status.parentElement?.className).not.toContain("p-4");
    expect(container.querySelectorAll(".p-4").length).toBe(1);
  });
});

describe("DataTable lines", () => {
  it("lets a cell take two lines and the row grow", () => {
    const { container } = render(
      <DataTable label="T" rowKey={(r: { id: string }) => r.id} rows={[{ id: "a" }]} columns={[{ id: "a", header: "A", cell: () => "x".repeat(200), lines: 2 }]} />,
    );
    expect(container.querySelector(".line-clamp-2")).not.toBeNull();
    expect(container.querySelector('[role="row"].min-h-\\[var\\(--control-h\\)\\]')).not.toBeNull();
  });
});

describe("data table layout", () => {
  it("DataTable fit is only as tall as its rows and marks a bleed table", () => {
    const { container } = render(<DataTable label="T" bleed fit rowKey={(r: { id: string }) => r.id} rows={[{ id: "a" }]} columns={[{ id: "a", header: "A", cell: () => "x" }]} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("flex-initial");
    expect(root.className.split(" ")).not.toContain("h-full");
    expect(root.getAttribute("data-bleed")).toBe("");
  });
});
