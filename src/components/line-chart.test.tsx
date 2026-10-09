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
    expect(screen.getByRole("status").textContent).toBe("Loading");
    expect(screen.getByRole("group", { name: "E" }).getAttribute("aria-busy")).toBe("true");
  });

  it("leaves room on the left for the longest value label", () => {
    const { container } = render(
      <LineChart label="RAM" series={[{ label: "RAM", points: pts([200, 1500, 900]) }]} formatValue={(v) => `${v} MB`} />,
    );
    const labels = [...container.querySelectorAll("svg text")].filter((t) => t.textContent?.endsWith(" MB"));
    expect(labels.some((t) => t.textContent === "2000 MB")).toBe(true);
    // right-aligned at x: the text runs left from x, about 9px a character, so x must leave that much room
    for (const t of labels) expect(Number(t.getAttribute("x"))).toBeGreaterThanOrEqual((t.textContent ?? "").length * 9);
  });

  it("picks a point on a click and with Enter, and shows the selected time", () => {
    const picks: number[] = [];
    const series = [{ label: "CPU", points: pts([10, 50, 30]) }];
    const { container, rerender } = render(<LineChart label="Host" series={series} onSelect={(t) => picks.push(t)} />);
    const plot = screen.getByRole("application");
    expect(plot.getAttribute("aria-label")).toContain("Enter picks one");
    fireEvent.keyDown(plot, { key: "Enter" }); // no point reached yet: nothing is picked
    expect(picks).toEqual([]);
    fireEvent.keyDown(plot, { key: "End" });
    fireEvent.keyDown(plot, { key: "Enter" });
    fireEvent.keyDown(plot, { key: "ArrowLeft" });
    fireEvent.keyDown(plot, { key: " " });
    expect(picks).toEqual([Date.UTC(2026, 9, 9, 0, 2), Date.UTC(2026, 9, 9, 0, 1)]);
    fireEvent.click(container.querySelector("svg.block")!, { clientX: 0 });
    expect(picks).toHaveLength(3);
    expect(document.body.textContent).not.toContain("Selected");
    rerender(<LineChart label="Host" series={series} onSelect={() => undefined} selected={Date.UTC(2026, 9, 9, 0, 1)} />);
    expect(document.body.textContent).toMatch(/Selected .*00:01|Selected .*12:01/);
  });

  it("does nothing on Enter or a click without onSelect", () => {
    const { container } = render(<LineChart label="Host" series={[{ label: "CPU", points: pts([10, 50, 30]) }]} />);
    expect(screen.getByRole("application").getAttribute("aria-label")).not.toContain("Enter");
    fireEvent.click(container.querySelector("svg.block")!);
  });
});
