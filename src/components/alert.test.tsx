import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Alert } from "./alert";

describe("Alert", () => {
  it("is an alert for danger and a status for the other tones, and shows title, text and action", () => {
    const { rerender } = render(<Alert tone="danger" title="Failed" action={<button>Retry</button>}>It broke.</Alert>);
    const a = screen.getByRole("alert");
    expect(a.getAttribute("data-tone")).toBe("danger");
    expect(a.textContent).toContain("Failed");
    expect(a.textContent).toContain("It broke.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    rerender(<Alert tone="warning">Careful</Alert>);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").getAttribute("data-tone")).toBe("warning");
    rerender(<Alert tone="warn">Careful</Alert>); // the old spelling is the same tone
    expect(screen.getByRole("status").getAttribute("data-tone")).toBe("warning");
    rerender(<Alert>Plain</Alert>);
    expect(screen.getByRole("status").getAttribute("data-tone")).toBe("info");
  });

  it("has a dismiss button only when asked", () => {
    const off = vi.fn();
    const { rerender } = render(<Alert>Hi</Alert>);
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    rerender(<Alert onDismiss={off}>Hi</Alert>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(off).toHaveBeenCalledTimes(1);
  });
});
