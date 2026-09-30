import { describe, expect, it, vi } from "vitest";
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
