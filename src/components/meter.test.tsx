import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Meter } from "../index";

describe("Meter", () => {
  it("is a meter with its value, limits and spoken text", () => {
    render(<Meter label="Level" value={42} format={(v) => `${v} %`} />);
    const m = screen.getByRole("meter", { name: "Level" });
    expect(m.getAttribute("aria-valuenow")).toBe("42");
    expect(m.getAttribute("aria-valuemin")).toBe("0");
    expect(m.getAttribute("aria-valuemax")).toBe("100");
    expect(m.getAttribute("aria-valuetext")).toBe("42 %");
    expect(screen.getByText("42 %")).toBeTruthy();
  });
  it.each([
    [10, "bg-ok"],
    [75, "bg-warning"],
    [95, "bg-danger"],
  ])("value %d draws the %s zone", (value, cls) => {
    const { container } = render(<Meter label="Level" value={value} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} />);
    expect(container.querySelector(`.${cls}`)).not.toBeNull();
  });
  it("is neutral without zones and clamps to its range", () => {
    const { container } = render(<Meter label="Level" value={500} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("100");
    expect(container.querySelector(".bg-ink-muted")).not.toBeNull();
  });
});
