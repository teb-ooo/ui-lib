import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { FilterBar } from "./filter-bar";

describe("FilterBar", () => {
  it("keeps every control inline when there is no primary slot", () => {
    setViewportWidth(390);
    render(
      <FilterBar aria-label="Filters">
        <button>Open only</button>
      </FilterBar>,
    );
    expect(screen.getByRole("button", { name: "Open only" })).toBeTruthy();
  });

  it("moves the filters into a sheet behind a Filters button on a phone", () => {
    setViewportWidth(390);
    render(
      <FilterBar aria-label="Issue filters" primary={<input aria-label="Search" />} activeCount={2}>
        <button>Open only</button>
      </FilterBar>,
    );
    expect(screen.getByLabelText("Search")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open only" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters (2)" }));
    expect(screen.getByRole("button", { name: "Open only" })).toBeTruthy();
  });

  it("shows the filters beside the primary controls from sm up", () => {
    setViewportWidth(1280);
    render(
      <FilterBar aria-label="Issue filters" primary={<input aria-label="Search" />}>
        <button>Open only</button>
      </FilterBar>,
    );
    expect(screen.getByRole("button", { name: "Open only" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
  });
});
