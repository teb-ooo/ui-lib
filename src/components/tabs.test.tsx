import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tabs } from "./tabs";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

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

describe("tabs layout", () => {
  it("Tabs fill makes the panel a scrolling flex column", () => {
    render(<Tabs label="t" value="a" onValueChange={() => undefined} fill tabs={[{ value: "a", label: "A", panel: <p>one</p> }]} />);
    expect(screen.getByRole("tabpanel").className).toContain("overflow-auto");
  });
});
