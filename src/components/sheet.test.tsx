import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Sheet } from "../index";

describe("Sheet", () => {
  it("opens from its trigger as a named dialog with a title, description and footer, and returns focus on Escape", async () => {
    render(
      <Sheet trigger={<Button>Open</Button>} title="Filters" description="Choose." footer={<Button>Apply</Button>}>
        <p>Body</p>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    expect(within(dialog).getByText("Choose.")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Apply" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes with its close button, and reports the change", async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet defaultOpen title="Panel" onOpenChange={onOpenChange} closeLabel="Dismiss">
        <p>Body</p>
      </Sheet>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("is modal by default (a backdrop) and non-modal with modal={false} (none, and a click outside does not close it)", async () => {
    const { unmount } = render(
      <Sheet defaultOpen title="A">
        <p>Body</p>
      </Sheet>,
    );
    await screen.findByRole("dialog");
    expect(document.querySelector(".anim-backdrop")).not.toBeNull();
    unmount();
    render(
      <div>
        <button type="button">Page button</button>
        <Sheet defaultOpen modal={false} title="B">
          <p>Body</p>
        </Sheet>
      </div>,
    );
    await screen.findByRole("dialog");
    expect(document.querySelector(".anim-backdrop")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Page button" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("drags down past the threshold to close, and springs back when dragged less", async () => {
    render(
      <Sheet defaultOpen title="Drag">
        <p>Body</p>
      </Sheet>,
    );
    const dialog = await screen.findByRole("dialog");
    const handle = dialog.querySelector("[aria-hidden=true].cursor-grab") as HTMLElement;
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 140, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 260, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
