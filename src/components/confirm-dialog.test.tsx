import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("shows the question, starts on Cancel, and Cancel closes without confirming", async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Delete this note?" confirmLabel="Delete" danger onConfirm={onConfirm} />);
    await screen.findByRole("dialog", { name: "Delete this note?" });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" })));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms, waits for a promise with a busy button, then closes", async () => {
    let finish: () => void = () => undefined;
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Sure?" confirmLabel="Do it" onConfirm={() => new Promise<void>((r) => (finish = r))} />);
    await userEvent.click(await screen.findByRole("button", { name: "Do it" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled")).toBe(true));
    expect(onOpenChange).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
