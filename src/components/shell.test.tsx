import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Shell } from "./shell";
import { Sidebar } from "./sidebar";

const items = [
  { id: "a", label: "Home", href: "/", active: true },
  { id: "b", label: "Tasks", href: "/tasks", badge: 3 },
];

describe("Sidebar", () => {
  it("marks the current page and shows badges", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Tasks/ }).textContent).toContain("3");
  });
  it("collapsed: labels stay available to assistive technology only, and the toggle reports the change", () => {
    let next: boolean | null = null;
    render(<Sidebar items={items} collapsed onCollapsedChange={(c) => (next = c)} />);
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(next).toBe(false);
  });
  it("draws links through renderLink", () => {
    render(<Sidebar items={items} renderLink={(item, content, props) => <span data-testid={item.id} className={props.className}>{content}</span>} />);
    expect(screen.getByTestId("b").textContent).toContain("Tasks");
  });
});

describe("Shell", () => {
  it("on a phone shows a menu button that opens the sidebar as a drawer", () => {
    render(
      <Shell sidebar={<Sidebar items={items} collapsed onCollapsedChange={() => undefined} />} header="Title">
        <p>Content</p>
      </Shell>,
    );
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
    // Inside the drawer the sidebar is always expanded: no collapse toggle.
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Expand sidebar" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
  });
});
