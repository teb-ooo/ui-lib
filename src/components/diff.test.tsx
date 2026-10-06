import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Diff, diffWords } from "../index";

describe("diffWords", () => {
  it.each([
    ["a b c", "a b c", [{ kind: "same", text: "a b c" }]],
    ["a b", "a b c", [{ kind: "same", text: "a b" }, { kind: "add", text: " c" }]],
    ["a b c", "a c", [{ kind: "same", text: "a " }, { kind: "del", text: "b " }, { kind: "same", text: "c" }]],
    ["old", "new", [{ kind: "del", text: "old" }, { kind: "add", text: "new" }]],
    ["", "x", [{ kind: "add", text: "x" }]],
    ["", "", []],
  ])("%j -> %j", (a, b, want) => {
    expect(diffWords(a, b)).toEqual(want);
  });
  it("reconstructs both sides", () => {
    const a = "the quick brown fox jumps";
    const b = "the slow brown dog jumps high";
    const t = diffWords(a, b);
    expect(t.filter((x) => x.kind !== "add").map((x) => x.text).join("")).toBe(a);
    expect(t.filter((x) => x.kind !== "del").map((x) => x.text).join("")).toBe(b);
  });
});

describe("Diff", () => {
  it("marks additions and removals with text, not only colour", () => {
    const { container } = render(<Diff before="a b" after="a c" />);
    expect(container.querySelector("del")?.textContent).toContain("removed");
    expect(container.querySelector("ins")?.textContent).toContain("added");
  });
  it("splits into before and after", () => {
    render(<Diff layout="split" before="a b" after="a c" />);
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });
  it("accepts tokens", () => {
    const { container } = render(<Diff tokens={[{ kind: "add", text: "new" }]} />);
    expect(container.querySelector("ins")).not.toBeNull();
  });
});
