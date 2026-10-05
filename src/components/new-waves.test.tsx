import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Accordion, Button, Collapsible, Menu, Meter, Switch, Tabs } from "../index";

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

describe("Tabs", () => {
  function T({ activation }: { activation?: "manual" }) {
    const [v, setV] = useState("a");
    return <Tabs label="Panels" value={v} onValueChange={setV} activation={activation} tabs={[{ value: "a", label: "Alpha", panel: <p>Alpha panel</p> }, { value: "b", label: "Beta", badge: 3, panel: <p>Beta panel</p> }, { value: "c", label: "Gamma", disabled: true, panel: <p>Gamma panel</p> }]} />;
  }
  it("shows the chosen panel, switches on click and names the list", async () => {
    render(<T />);
    expect(screen.getByRole("tablist", { name: "Panels" })).toBeTruthy();
    expect(screen.getByText("Alpha panel")).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: /Beta/ }));
    expect(screen.getByText("Beta panel")).toBeTruthy();
    expect(screen.queryByText("Alpha panel")).toBeNull();
    expect(screen.getByRole("tab", { name: /Beta/ }).getAttribute("aria-selected")).toBe("true");
  });
  it("arrow keys show the next panel (automatic) and skip a disabled tab", async () => {
    render(<T />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(await screen.findByText("Beta panel")).toBeTruthy();
    await userEvent.keyboard("{ArrowRight}");
    // Gamma is disabled: the arrow keys reach it but it is never chosen, so its panel never shows.
    expect(screen.queryByText("Gamma panel")).toBeNull();
    expect(screen.getByRole("tab", { name: "Gamma" }).getAttribute("aria-selected")).toBe("false");
  });
  it("manual activation waits for Enter", async () => {
    render(<T activation="manual" />);
    screen.getByRole("tab", { name: "Alpha" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.queryByText("Beta panel")).toBeNull();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByText("Beta panel")).toBeTruthy();
  });
});

describe("Accordion and Collapsible", () => {
  it("opens and closes sections with the header button, several at once", async () => {
    render(<Accordion items={[{ value: "a", title: "Noise", content: <p>Noise body</p> }, { value: "b", title: "Notch", content: <p>Notch body</p> }]} />);
    const noise = screen.getByRole("button", { name: "Noise" });
    expect(noise.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(noise);
    await userEvent.click(screen.getByRole("button", { name: "Notch" }));
    expect(await screen.findByText("Noise body")).toBeTruthy();
    expect(screen.getByText("Notch body")).toBeTruthy();
    await userEvent.click(noise);
    await waitFor(() => expect(screen.queryByText("Noise body")).toBeNull());
  });
  it("a trailing control sits beside the toggle, works while closed and does not toggle the section", async () => {
    const onChange = vi.fn();
    render(<Accordion items={[{ value: "a", title: "Noise", trailing: <Switch label="Noise on" checked={false} onCheckedChange={onChange} />, content: <p>Body</p> }]} />);
    await userEvent.click(screen.getByRole("switch", { name: "Noise on" }));
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Noise" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "Noise" }).contains(screen.getByRole("switch"))).toBe(false);
  });
  it("Collapsible is one section and reports its state", async () => {
    const onOpenChange = vi.fn();
    render(<Collapsible title="Advanced" onOpenChange={onOpenChange}><p>More</p></Collapsible>);
    await userEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    expect(await screen.findByText("More")).toBeTruthy();
  });
});

describe("Meter", () => {
  it("is a meter with its value, limits and spoken text", () => {
    render(<Meter label="Level" value={42} format={(v) => `${v} %`} />);
    const m = screen.getByRole("meter", { name: "Level" });
    expect(m.getAttribute("aria-valuenow")).toBe("42");
    expect(m.getAttribute("aria-valuemin")).toBe("0");
    expect(m.getAttribute("aria-valuemax")).toBe("100");
    expect(m.getAttribute("aria-valuetext")).toBe("42 %");
    expect(screen.getByText("42 %")).toBeTruthy();
  });
  it.each([
    [10, "bg-ok"],
    [75, "bg-warning"],
    [95, "bg-danger"],
  ])("value %d draws the %s zone", (value, cls) => {
    const { container } = render(<Meter label="Level" value={value} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} />);
    expect(container.querySelector(`.${cls}`)).not.toBeNull();
  });
  it("is neutral without zones and clamps to its range", () => {
    const { container } = render(<Meter label="Level" value={500} />);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("100");
    expect(container.querySelector(".bg-ink-muted")).not.toBeNull();
  });
});
