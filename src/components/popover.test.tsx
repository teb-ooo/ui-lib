import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Popover, Tooltip } from "../index";

describe("Popover", () => {
  it("opens from its trigger as a named dialog, closes on Escape and returns focus to the trigger", async () => {
    const onOpenChange = vi.fn();
    render(
      <Popover trigger={<Button>Details</Button>} title="Build details" onOpenChange={onOpenChange}>
        <p>All checks passed.</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    await userEvent.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Build details" })).toBeTruthy();
    expect(screen.getByText("All checks passed.")).toBeTruthy();
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("can show its title and a close button", async () => {
    render(
      <Popover trigger={<Button>Open</Button>} title="Filters" showTitle showClose>
        <p>Body</p>
      </Popover>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Filters")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("Popover modes", () => {
  it("hover card: opens when the pointer rests, can be entered, and closes on Escape", async () => {
    render(
      <Popover openOn="hover" trigger={<Button>Entry</Button>} title="Mother Meridian" delay={0}>
        <a href="#entry">Open the entry</a>
      </Popover>,
    );
    await userEvent.hover(screen.getByRole("button", { name: "Entry" }));
    const card = await screen.findByRole("dialog", { name: "Mother Meridian" });
    expect(card.querySelector("a")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("hover card: the keyboard reaches it too (Enter on the trigger)", async () => {
    render(
      <Popover openOn="hover" trigger={<Button>Entry</Button>} title="Mother Meridian">
        <p>Details</p>
      </Popover>,
    );
    screen.getByRole("button", { name: "Entry" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("dialog", { name: "Mother Meridian" })).toBeTruthy();
  });

  it("tip: a one-line tooltip on hover and focus, announced as a tooltip, not a dialog", async () => {
    render(<Popover openOn="hover" tip="Saves the draft" delay={0} trigger={<Button>Save</Button>} />);
    await userEvent.hover(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("tooltip")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Tooltip is the tip mode under its own name", async () => {
    render(
      <Tooltip tip="Open the menu" delay={0}>
        <Button>Menu</Button>
      </Tooltip>,
    );
    screen.getByRole("button", { name: "Menu" }).focus();
    expect((await screen.findByRole("tooltip")).textContent).toBe("Open the menu");
  });

  it("the types keep impossible combinations out", () => {
    // @ts-expect-error a tip is text only: it takes no children
    const a = <Popover openOn="hover" tip="x" trigger={<Button>t</Button>}><p>no</p></Popover>;
    // @ts-expect-error a hover card has no close button: the pointer leaving closes it
    const b = <Popover openOn="hover" title="t" showClose trigger={<Button>t</Button>}><p>no</p></Popover>;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });
});

describe("Popover trigger that is not a button", () => {
  it("a focusable div trigger raises no Base UI nativeButton warning, and still opens on click", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<Popover trigger={<div role="slider" tabIndex={0} aria-label="Stop" aria-valuenow={0} />} title="Colour">Panel</Popover>);
    await user.click(screen.getByRole("slider", { name: "Stop" }));
    expect(await screen.findByText("Panel")).toBeTruthy();
    expect(err.mock.calls.some((c) => String(c[0]).includes("nativeButton"))).toBe(false);
    err.mockRestore();
  });
});
