import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ViewMenu } from "./view-menu";

describe("ViewMenu", () => {
  it("shows the active view's name on the trigger", () => {
    render(<ViewMenu views={[{ id: "v", name: "Urgent" }]} activeId="v" onSelect={() => undefined} />);
    expect(screen.getByRole("button", { name: "Urgent" })).toBeTruthy();
  });
});
