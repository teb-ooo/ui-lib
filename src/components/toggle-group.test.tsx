import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToggleGroup } from "./toggle-group";

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
