import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { Button } from "./button";
import { Input } from "./input";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Modal } from "./modal";
import { SplitPane } from "./split-pane";

describe("Modal", () => {
  it("dims the page when it opens inside another dialog (a phone's detail view)", () => {
    setViewportWidth(390);
    render(
      <SplitPane
        list={<p>list</p>}
        detail={
          <Modal open title="Delete this note?">
            <p>sure</p>
          </Modal>
        }
        detailOpen
        detailLabel="Note"
        onDetailClose={() => undefined}
      />,
    );
    expect(document.querySelector(".anim-backdrop")).not.toBeNull();
  });
});

describe("Modal drawer", () => {
  it("opens as a drawer docked to the right", async () => {
    render(<Modal variant="drawer" defaultOpen title="Revisions" />);
    const popup = await screen.findByRole("dialog", { name: "Revisions" });
    expect(popup).toHaveAttribute("data-variant", "drawer");
    expect(popup.className).toContain("right-0");
    expect(popup.className).toContain("anim-sheet");
  });
});

describe("Modal", () => {
  it("opens from its trigger, is named, moves focus in, closes on Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <Modal trigger={<Button>Open</Button>} title="Remove passkey" description="This cannot be undone." footer={<Button intent="danger">Remove</Button>}>
        <Input aria-label="Confirm" />
      </Modal>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Remove passkey" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("closes with the close control and reports onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Modal defaultOpen onOpenChange={onOpenChange} title="Hello" />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
  it("is controlled by `open`", async () => {
    const { rerender } = render(<Modal open={false} title="T" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Modal open title="T" />);
    expect(await screen.findByRole("dialog", { name: "T" })).toBeInTheDocument();
  });
});

describe("Modal variants", () => {
  it("centre is the default", async () => {
    render(<Modal defaultOpen title="T" />);
    expect((await screen.findByRole("dialog")).getAttribute("data-variant")).toBe("dialog");
  });
  it("top places the panel near the top", async () => {
    render(<Modal defaultOpen variant="top" title="T" />);
    const d = await screen.findByRole("dialog");
    expect(d).toHaveAttribute("data-variant", "top");
    expect(d.className).toContain("top-[15vh]");
    expect(d.className).toContain("max-w-lg");
  });
  it("bare has no close control and keeps the accessible name", async () => {
    render(<Modal defaultOpen bare title="Palette"><input aria-label="Search" /></Modal>);
    expect(await screen.findByRole("dialog", { name: "Palette" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
  it("can focus a chosen element on open", async () => {
    const ref = createRef<HTMLInputElement>();
    render(<Modal defaultOpen bare title="P" initialFocus={ref}><input ref={ref} aria-label="Search" /></Modal>);
    await waitFor(() => expect(screen.getByLabelText("Search")).toHaveFocus());
  });
});

describe("Modal initial focus", () => {
  it("starts on the first field of the content, not on the close button", async () => {
    render(
      <Modal open onOpenChange={() => undefined} title="Rename" footer={<button type="button">Save</button>}>
        <label>
          Name
          <input defaultValue="x" />
        </label>
      </Modal>,
    );
    const field = await screen.findByRole("textbox", { name: "Name" });
    await waitFor(() => expect(document.activeElement).toBe(field));
  });

  it("an initialFocus of the app still wins, and a dialog with no control in its content keeps the default (a control of the dialog has focus)", async () => {
    const second = createRef<HTMLInputElement>();
    const first = render(
      <Modal open onOpenChange={() => undefined} title="Two" initialFocus={second}>
        <input aria-label="first" />
        <input ref={second} aria-label="second" />
      </Modal>,
    );
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "second" })));
    first.unmount();
    render(
      <Modal open onOpenChange={() => undefined} title="Plain" description="Just text.">
        <p>No controls here.</p>
      </Modal>,
    );
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
  });
});
