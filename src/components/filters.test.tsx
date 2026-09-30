import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SearchInput } from "./search-input";
import { ToggleGroup } from "./toggle-group";
import { ViewMenu } from "./view-menu";

describe("SearchInput", () => {
  it("reports typing, clears with the button and with Escape", () => {
    const onValueChange = vi.fn();
    render(<SearchInput value="abc" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), { target: { value: "abcd" } });
    expect(onValueChange).toHaveBeenLastCalledWith("abcd");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onValueChange).toHaveBeenLastCalledWith("");
    onValueChange.mockClear();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(onValueChange).toHaveBeenCalledWith("");
  });
  it("shows no clear button while empty", () => {
    render(<SearchInput value="" onValueChange={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });
});

describe("ToggleGroup", () => {
  const options = [
    { value: "a", label: "A" },
    { value: "b", label: "B", count: 3 },
  ];
  it("single: choosing again clears", () => {
    const onValueChange = vi.fn();
    render(<ToggleGroup label="Type" options={options} value="a" onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "A" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: /B/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("b");
  });
  it("multiple: adds and removes", () => {
    const onValueChange = vi.fn();
    render(<ToggleGroup multiple label="Type" options={options} value={["a"]} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: /B/ }));
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });
});

describe("ViewMenu", () => {
  it("shows the active view's name on the trigger", () => {
    render(<ViewMenu views={[{ id: "v", name: "Urgent" }]} activeId="v" onSelect={() => undefined} />);
    expect(screen.getByRole("button", { name: "Urgent" })).toBeTruthy();
  });
});
