import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, initialsOf } from "../index";

describe("Avatar", () => {
  it("falls back to initials when there is no image, named for assistive tech", () => {
    render(<Avatar name="alex_tebbs" />);
    const a = screen.getByRole("img", { name: "alex_tebbs" });
    expect(a).toHaveTextContent("AT");
  });
  it("falls back for a single word", () => {
    render(<Avatar name="alex" size="lg" />);
    expect(screen.getByRole("img", { name: "alex" })).toHaveTextContent("AL");
    expect(screen.getByRole("img")).toHaveAttribute("data-size", "lg");
  });
  it("shows initials while the image has not loaded (jsdom never loads images)", () => {
    render(<Avatar name="Sam Lee" src="/avatar/1" />);
    expect(screen.getByRole("img", { name: "Sam Lee" })).toHaveTextContent("SL");
  });
  it("computes initials", () => {
    expect(initialsOf("  ")).toBe("?");
    expect(initialsOf("ada lovelace")).toBe("AL");
    expect(initialsOf("x")).toBe("X");
  });
});
