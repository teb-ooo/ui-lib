import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SearchInput } from "./search-input";

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
