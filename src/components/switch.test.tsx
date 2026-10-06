import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Switch } from "./switch";

describe("Switch", () => {
  it("is a switch named by its label, reports changes and describes itself", () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Email me" description="Once a day" checked={false} onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole("switch", { name: "Email me" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.click(sw);
    expect(onCheckedChange.mock.lastCall?.[0]).toBe(true);
  });
  it("does not change when disabled", () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Locked" disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "Locked" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
