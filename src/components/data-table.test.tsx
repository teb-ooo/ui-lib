import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { DataTable } from "./data-table";
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
    expect(rowOf("Beta").className).toContain("inset");
    expect(rowOf("Alpha").className).not.toContain("inset");
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
    expect([...(onSelectedKeysChange.mock.lastCall?.[0] as Set<string>)].sort()).toEqual(["a", "b"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect([...(onSelectedKeysChange.mock.lastCall?.[0] as Set<string>)].sort()).toEqual(["a", "b", "c"]);
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
});
