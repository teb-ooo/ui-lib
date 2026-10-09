import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Card, CardGrid } from "./card";
import { PageHeader, Section } from "./section";
import { ToggleGroup } from "./toggle-group";

describe("Card and CardGrid", () => {
  it("a card with an href is one link holding its text, in a list", () => {
    render(
      <CardGrid label="Apps">
        <Card title="ah" description="The dashboard" href="/apps/ah" footer="2 minutes ago" marker={<span>Needs you</span>} />
      </CardGrid>,
    );
    expect(screen.getByRole("list", { name: "Apps" })).toBeTruthy();
    const link = screen.getByRole("link", { name: /ah/ });
    expect(link.getAttribute("href")).toBe("/apps/ah");
    expect(link.textContent).toContain("The dashboard");
  });

  it("the arrow keys move focus between cards, Home and End jump", () => {
    render(
      <CardGrid label="Apps">
        <Card title="one" href="#1" />
        <Card title="two" href="#2" />
        <Card title="three" href="#3" />
      </CardGrid>,
    );
    const links = screen.getAllByRole("link");
    links[0]!.focus();
    fireEvent.keyDown(links[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(links[1]);
    fireEvent.keyDown(links[1]!, { key: "End" });
    expect(document.activeElement).toBe(links[2]);
    fireEvent.keyDown(links[2]!, { key: "Home" });
    expect(document.activeElement).toBe(links[0]);
  });

  it("a card with onClick is a button; one with neither is plain content", () => {
    const { rerender } = render(<Card title="x" onClick={() => undefined} />);
    expect(screen.getByRole("button", { name: /x/ })).toBeTruthy();
    rerender(<Card title="x" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("Section and PageHeader", () => {
  it("draws a full-width rule outside the inset content", () => {
    const { container } = render(
      <>
        <PageHeader title="Apps" description="All of them" />
        <Section title="Needs you" rule="both">
          body
        </Section>
        <Section rule="none">last</Section>
      </>,
    );
    const [header, both, none] = [...container.querySelectorAll("section")];
    expect(header!.className).toContain("border-b");
    expect(screen.getByRole("heading", { level: 1, name: "Apps" }).className).toContain("display-lg");
    expect(both!.className).toContain("border-t");
    expect(both!.className).toContain("border-b");
    expect(none!.className).not.toContain("border-b");
  });
});

describe("ToggleGroup required", () => {
  it("does not clear the chosen value when chosen again", () => {
    let value: string | null = "cards";
    render(<ToggleGroup label="View" required value={value} onValueChange={(v) => (value = v)} options={[{ value: "cards", label: "Cards" }, { value: "table", label: "Table" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    expect(value).toBe("cards");
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(value).toBe("table");
  });
});

describe("Card background", () => {
  it("has no fill of its own: it shows the page behind it", () => {
    render(<Card title="Plain" />);
    expect(screen.getByRole("listitem").querySelector("[data-card]")?.className).toContain("bg-transparent");
  });
});
