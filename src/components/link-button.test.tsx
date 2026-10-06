import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkButton } from "./link-button";

describe("router-aware LinkButton", () => {
  it("draws the link through render, with the class and children", () => {
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- the link's children arrive in the spread props
    const render1 = vi.fn((props: Record<string, unknown>) => <a data-router="1" {...props} href="/rules" />);
    render(<LinkButton render={render1 as never}>Back to the rules</LinkButton>);
    const a = screen.getByRole("link", { name: "Back to the rules" });
    expect(a.getAttribute("data-router")).toBe("1");
    expect(a.className).toContain("btn");
  });
});

describe("LinkButton", () => {
  it("is a real link with the button look", () => {
    render(<LinkButton href="/docs" intent="solid">Docs</LinkButton>);
    const a = screen.getByRole("link", { name: "Docs" });
    expect(a).toHaveAttribute("href", "/docs");
    expect(a).toHaveClass("btn", "btn-solid");
  });
  it("marks the current page", () => {
    render(<LinkButton href="/here" active>Here</LinkButton>);
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });
  it("icon-only takes its name from the tip", () => {
    render(<LinkButton href="/x" icon={<svg />} tip="Open" />);
    expect(screen.getByRole("link", { name: "Open" })).toHaveClass("btn-icon");
  });
});
