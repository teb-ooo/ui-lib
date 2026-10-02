import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveIndicator } from "./live-indicator";
import type { LiveStatus } from "./live-indicator";

describe("LiveIndicator", () => {
  const cases: [LiveStatus, string][] = [
    ["live", "Live"],
    ["reconnecting", "Reconnecting"],
    ["degraded", "Live updates degraded"],
    ["off", "Not live"],
  ];
  it.each(cases)("%s has the accessible name %s and exposes its status", (status, name) => {
    render(<LiveIndicator status={status} />);
    const el = screen.getByRole("status", { name });
    expect(el.getAttribute("data-status")).toBe(status);
  });
  it("has no tooltip unless asked, and is then focusable", () => {
    const { rerender } = render(<LiveIndicator status="live" />);
    expect(screen.getByRole("status").getAttribute("tabindex")).toBeNull();
    rerender(<LiveIndicator status="live" tip="Updates arrive live" />);
    expect(screen.getByRole("status").getAttribute("tabindex")).toBe("0");
  });
  it("is only a dot: no visible text", () => {
    render(<LiveIndicator status="live" />);
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
