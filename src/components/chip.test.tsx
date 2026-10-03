import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
