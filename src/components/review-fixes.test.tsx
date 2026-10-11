import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Card, DataTable, Field, Input, Prose, Select } from "../index";

describe("interface review fixes", () => {
  it("a Field can keep a line free for its error so the fields below do not move", () => {
    const { container, rerender } = render(<Field label="Title" reserveError><Input /></Field>);
    expect(container.querySelector(".min-h-\\[1\\.6em\\]")).not.toBeNull();
    rerender(<Field label="Title"><Input /></Field>);
    expect(container.querySelector(".min-h-\\[1\\.6em\\]")).toBeNull();
  });

  it("an open Select with no options says so instead of drawing an empty sliver", async () => {
    render(<Select label="Project" options={[]} value={null} onValueChange={() => undefined} />);
    await userEvent.setup().click(screen.getByRole("combobox", { name: "Project" }));
    expect(await screen.findByText("No options")).toBeTruthy();
  });

  it("a sortable column header puts its label first and the sort icon after it", () => {
    render(<DataTable label="T" columns={[{ id: "a", header: "Name", sortable: true, cell: (r: { a: string }) => r.a }]} rows={[{ a: "x" }]} rowKey={(r) => r.a} />);
    const button = screen.getByRole("button", { name: /Name/ });
    expect(button.lastElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(button.textContent?.trim()).toBe("Name");
  });

  it("an invalid field draws its border in the full danger colour", () => {
    const css = readFileSync(join(import.meta.dirname, "..", "..", "theme.css"), "utf8");
    expect(css).toMatch(/\.input\[aria-invalid="true"\]\s*\{\s*border-color:\s*var\(--color-danger\);/);
  });

  it("a Card can be drawn by the router's link, so it is a real link that does not reload", () => {
    render(<Card title="Aldor" description="A world" render={(props) => <a {...props} href="/worlds/1" data-router="yes">{props.children}</a>} />);
    const link = screen.getByRole("link", { name: /Aldor/ });
    expect(link).toHaveAttribute("href", "/worlds/1");
    expect(link).toHaveAttribute("data-router", "yes");
    expect(link).toHaveAttribute("data-card");
  });

  it("Prose can cap its line length near 70 characters, and does not by default", () => {
    const { container, rerender } = render(<Prose measure>text</Prose>);
    expect(container.firstElementChild?.className).toContain("max-w-[70ch]");
    rerender(<Prose>text</Prose>);
    expect(container.firstElementChild?.className).not.toContain("max-w-");
  });
});
