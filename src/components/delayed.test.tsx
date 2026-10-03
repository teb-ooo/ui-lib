import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { DataTable } from "./data-table";
import { Delayed } from "./delayed";

describe("loading feedback waits", () => {
  it("Delayed carries the delayed fade class", () => {
    render(<Delayed>Loading</Delayed>);
    expect(screen.getByText("Loading").className).toContain("anim-delayed");
  });

  it("a loading Button's spinner and a DataTable's skeleton rows are delayed", () => {
    const { container, rerender } = render(<Button loading>Save</Button>);
    expect(container.querySelector(".anim-delayed svg")).not.toBeNull();
    rerender(<DataTable columns={[{ id: "a", header: "A", cell: () => "x" }]} rows={[]} rowKey={() => "k"} label="T" loading />);
    expect(container.querySelectorAll(".anim-delayed").length).toBeGreaterThan(0);
  });
});
