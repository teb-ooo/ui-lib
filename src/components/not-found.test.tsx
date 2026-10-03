import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFound } from "./not-found";

describe("NotFound", () => {
  it("shows a heading, a sentence and the way back", () => {
    render(<NotFound action={<a href="/">Back to start</a>} />);
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeTruthy();
    expect(screen.getByText("There is nothing at this address.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to start" })).toBeTruthy();
  });

  it("uses the display size for a page and the body size for a pane", () => {
    const { rerender } = render(<NotFound />);
    expect(screen.getByRole("heading").className).toContain("display-lg");
    rerender(<NotFound variant="pane" title="No such note" />);
    expect(screen.getByRole("heading", { name: "No such note" }).className).not.toContain("display-lg");
  });
});
