import { describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import { Check } from "lucide-react";
import { Button } from "./button";
import { Menu } from "./menu";
import userEvent from "@testing-library/user-event";

describe("Menu", () => {
  it("opens from its trigger, runs a chosen action, and closes", async () => {
    const onSelect = vi.fn();
    render(<Menu trigger={<Button>Open</Button>} items={[{ id: "a", label: "Rename", onSelect }, { id: "s", type: "separator" }, { id: "d", label: "Delete", danger: true, onSelect: vi.fn() }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const menu = await screen.findByRole("menu", { name: "Open" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Rename" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("moves with the arrow keys, chooses with Enter and closes with Escape", async () => {
    const first = vi.fn();
    const second = vi.fn();
    render(<Menu trigger={<Button>Open</Button>} items={[{ id: "a", label: "First", onSelect: first }, { id: "b", label: "Second", onSelect: second }]} />);
    screen.getByRole("button", { name: "Open" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("has on/off rows that report their state, and a disabled row that does nothing", async () => {
    const onChange = vi.fn();
    const run = vi.fn();
    render(<Menu trigger={<Button>View</Button>} items={[{ id: "g", type: "checkbox", label: "Grid", checked: false, onCheckedChange: onChange }, { id: "x", label: "Export", disabled: true, onSelect: run }]} />);
    await userEvent.click(screen.getByRole("button", { name: "View" }));
    await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Grid" }));
    expect(onChange.mock.calls[0]?.[0]).toBe(true);
    // An on/off row flips and leaves the menu open, so several can be set in one visit.
    expect(screen.getByRole("menu")).toBeTruthy();
    await userEvent.click(screen.getByRole("menuitem", { name: "Export" }));
    expect(run).not.toHaveBeenCalled();
  });
});

describe("menu layout", () => {
  it("Menu items accept a component icon", () => {
    render(<Menu trigger={<Button>Open</Button>} items={[{ type: "action", id: "a", label: "A", icon: Check, onSelect: () => undefined }]} />);
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });
});
