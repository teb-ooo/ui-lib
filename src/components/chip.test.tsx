import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./chip";

describe("Chip", () => {
  it("draws an app-chosen swatch instead of a tone class", () => {
    render(<Chip color="teal">api</Chip>);
    const chip = screen.getByText("api");
    expect(chip.getAttribute("data-color")).toBe("teal");
    expect(chip.className).not.toContain("chip-ok");
  });

  it("uses the tone class when there is no priority", () => {
    render(<Chip tone="ok">fine</Chip>);
    expect(screen.getByText("fine").className).toContain("chip-ok");
  });
});

describe("Chip actions", () => {
  it("removes", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove} removeLabel="Remove Mira">Mira</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Remove Mira" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
  it("toggles the lock and names the action", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Chip locked={false} onLockedChange={onChange}>draft</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Chip locked onLockedChange={onChange}>canon</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
  it("has no controls by default", () => {
    render(<Chip>plain</Chip>);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Chip", () => {
  it.each([
    ["default", null],
    ["ok", "chip-ok"],
    ["warning", "chip-warning"],
    ["warn", "chip-warning"],
    ["muted", "chip-muted"],
    ["danger", "chip-danger"],
    ["link", "chip-link"],
    ["agent", "chip-agent"],
  ] as const)("tone %s", (tone, cls) => {
    render(<Chip tone={tone}>x</Chip>);
    const c = screen.getByText("x");
    expect(c).toHaveClass("chip");
    if (cls) expect(c).toHaveClass(cls);
  });
});
