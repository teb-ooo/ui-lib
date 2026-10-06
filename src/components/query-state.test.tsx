import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryState } from "./query-state";

const ok = <T,>(data: T) => ({ data, error: null, isPending: false });

describe("QueryState", () => {
  it("draws the children with the data", () => {
    render(<QueryState query={ok(["a"])}>{(d) => <p>{d.length} rows</p>}</QueryState>);
    expect(screen.getByText("1 rows")).toBeTruthy();
  });
  it("says loading while pending", () => {
    render(<QueryState query={{ data: undefined, error: null, isPending: true }}>{() => <p>never</p>}</QueryState>);
    expect(screen.getByRole("status").textContent).toBe("Loading.");
  });
  it("shows a sentence, never the raw message, and retries", async () => {
    const refetch = vi.fn();
    render(<QueryState query={{ data: undefined, error: new Error("internal: secret"), isPending: false, refetch }}>{() => null}</QueryState>);
    expect(screen.getByRole("alert").textContent).not.toContain("secret");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it("keeps the data when a later refresh fails", () => {
    render(<QueryState query={{ data: ["a"], error: new Error("x"), isPending: false }}>{() => <p>still here</p>}</QueryState>);
    expect(screen.getByText("still here")).toBeTruthy();
  });
  it("draws empty for an empty array and for an empty items list", () => {
    const { rerender } = render(<QueryState query={ok([])} empty={<p>nothing</p>}>{() => <p>rows</p>}</QueryState>);
    expect(screen.getByText("nothing")).toBeTruthy();
    rerender(<QueryState query={ok({ items: [] })} empty={<p>nothing</p>}>{() => <p>rows</p>}</QueryState>);
    expect(screen.getByText("nothing")).toBeTruthy();
  });
});
