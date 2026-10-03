import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Chip } from "./chip";

describe("Chip", () => {
  it("draws a priority level from the priority scale", () => {
    render(<Chip priority={1}>P1</Chip>);
    const chip = screen.getByText("P1");
    expect(chip.className).toContain("chip-p1");
    expect(chip.getAttribute("data-priority")).toBe("1");
  });

  it("uses the tone class when there is no priority", () => {
    render(<Chip tone="ok">fine</Chip>);
    expect(screen.getByText("fine").className).toContain("chip-ok");
  });
});
