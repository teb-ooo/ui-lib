import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { handleSuggestionKey, SuggestionList } from "../index";

describe("handleSuggestionKey", () => {
  const make = () => ({ count: 3, activeIndex: 2, onActiveIndexChange: vi.fn(), onSelect: vi.fn(), onClose: vi.fn() });
  it("wraps down and up", () => {
    const o = make();
    expect(handleSuggestionKey({ key: "ArrowDown" }, o)).toBe(true);
    expect(o.onActiveIndexChange).toHaveBeenCalledWith(0);
    handleSuggestionKey({ key: "ArrowUp" }, { ...o, activeIndex: 0 });
    expect(o.onActiveIndexChange).toHaveBeenLastCalledWith(2);
  });
  it("chooses on Enter and Tab, closes on Escape, ignores others", () => {
    const o = make();
    handleSuggestionKey({ key: "Enter" }, o);
    handleSuggestionKey({ key: "Tab" }, o);
    expect(o.onSelect).toHaveBeenCalledTimes(2);
    handleSuggestionKey({ key: "Escape" }, o);
    expect(o.onClose).toHaveBeenCalled();
    expect(handleSuggestionKey({ key: "a" }, o)).toBe(false);
  });
  it("lets Enter through when the list is empty", () => {
    const o = { ...make(), count: 0 };
    expect(handleSuggestionKey({ key: "Enter" }, o)).toBe(false);
  });
});

describe("SuggestionList", () => {
  const items = [{ id: "a", label: "Alpha", hint: "Place" }, { id: "b", label: "Beta" }];
  it("is a listbox with options, the active one selected", async () => {
    const onSelect = vi.fn();
    render(<SuggestionList open items={items} activeIndex={1} onSelect={onSelect} anchor={() => new DOMRect(10, 10, 0, 16)} label="Entries" id="s" />);
    const list = await screen.findByRole("listbox", { name: "Entries" });
    const opts = within(list).getAllByRole("option");
    expect(opts).toHaveLength(2);
    expect(opts[1]).toHaveAttribute("aria-selected", "true");
    expect(opts[1]).toHaveAttribute("id", "s-option-1");
    await userEvent.click(opts[0]!);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });
  it("says when nothing matches", async () => {
    render(<SuggestionList open items={[]} activeIndex={0} onSelect={() => undefined} anchor={null} label="Entries" />);
    expect(await screen.findByText("No matches")).toBeInTheDocument();
  });
  it("renders nothing when closed", () => {
    render(<SuggestionList open={false} items={items} activeIndex={0} onSelect={() => undefined} anchor={null} label="Entries" />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
