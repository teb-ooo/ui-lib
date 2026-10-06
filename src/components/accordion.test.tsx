import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion, Collapsible } from "../index";
import { Switch } from "./switch";

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
