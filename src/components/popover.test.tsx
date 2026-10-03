import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Popover } from "../index";

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
