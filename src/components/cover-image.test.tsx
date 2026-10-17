import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button, CoverImage } from "../index";

describe("CoverImage", () => {
  it("draws the picture cropped to the banner, with its actions in a hover and focus group", () => {
    const { container } = render(<CoverImage src="/c.png" alt="A coast" actions={<Button>Change cover</Button>} />);
    const img = screen.getByRole("img", { name: "A coast" });
    expect(img.className).toContain("object-cover");
    const fig = container.querySelector("figure[data-cover]") as HTMLElement;
    expect(fig.className).toContain("group");
    expect(fig.className).toContain("sm:h-64");
    const actions = screen.getByRole("button", { name: "Change cover" }).parentElement as HTMLElement;
    expect(actions.className).toContain("group-hover:opacity-100");
    expect(actions.className).toContain("group-focus-within:opacity-100");
    expect(actions.className).toContain("pointer-coarse:opacity-100");
    expect(actions.className).toContain("max-sm:opacity-100");
  });

  it("fades in when loaded and draws nothing when it fails", () => {
    const { container } = render(<CoverImage src="/c.png" alt="A coast" />);
    const img = screen.getByRole("img", { name: "A coast" });
    expect(img.className).toContain("opacity-0");
    fireEvent.load(img);
    expect(img.className).toContain("opacity-100");
    fireEvent.error(img);
    expect(container.querySelector("figure")).toBeNull();
  });

  it("with no picture it is an Add cover row when onAdd is given, and nothing otherwise", () => {
    const onAdd = vi.fn();
    const { container, rerender } = render(<CoverImage alt="" onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add cover" }));
    expect(onAdd).toHaveBeenCalled();
    rerender(<CoverImage alt="" />);
    expect(container.firstChild).toBeNull();
  });
});
