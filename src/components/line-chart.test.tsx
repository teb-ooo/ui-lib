import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LineChart } from "./line-chart";

const pts = (vs: (number | null)[]) => vs.map((value, i) => ({ time: new Date(Date.UTC(2026, 9, 9, 0, i)).toISOString(), value }));

describe("LineChart", () => {
  it("names itself, lists the legend and gives a text alternative", () => {
    render(
      <LineChart label="Host" series={[{ label: "CPU", points: pts([10, 50, 30]) }, { label: "RAM", points: pts([60, 62, 64]) }]} formatValue={(v) => `${v} %`} />,
    );
    expect(screen.getByRole("group", { name: "Host" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Legend" }).textContent).toContain("CPU");
    expect(document.body.textContent).toContain("CPU: lowest 10 %, highest 50 %, latest 30 %.");
    expect(document.body.textContent).toContain("RAM: lowest 60 %, highest 64 %, latest 64 %.");
  });

  it("reads out every series at a point with the keyboard", () => {
    render(<LineChart label="Host" series={[{ label: "CPU", points: pts([10, 50, 30]) }, { label: "RAM", points: pts([60, 62, 64]) }]} formatValue={(v) => `${v} %`} />);
    const plot = screen.getByRole("application");
    fireEvent.keyDown(plot, { key: "Home" });
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(/CPU 10 %\s+RAM 60 %/);
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(/CPU 50 %\s+RAM 62 %/);
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(document.querySelector("[aria-live]")?.textContent).toBe("");
  });

  it("leaves a gap for a null value", () => {
    const { container } = render(<LineChart label="Gap" series={[{ label: "A", points: pts([1, null, 3]) }]} />);
    const d = container.querySelector("path")!.getAttribute("d")!;
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it("has an empty and a loading state", () => {
    const { rerender } = render(<LineChart label="E" series={[{ label: "A", points: [] }]} emptyText="No samples yet" />);
    expect(screen.getByText("No samples yet")).toBeTruthy();
    rerender(<LineChart label="E" series={[]} loading />);
    expect(screen.getByText("Loading")).toBeTruthy();
    expect(screen.getByRole("group", { name: "E" }).getAttribute("aria-busy")).toBe("true");
  });
});
