import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("empty state layout", () => {
  it("renders the empty state with its action", () => {
    render(<EmptyState title="No retired rules" action={<button>Clear filters</button>} />);
    expect(screen.getByRole("status").textContent).toContain("No retired rules");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });
});
