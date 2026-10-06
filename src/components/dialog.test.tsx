import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { Button } from "./button";
import { Input } from "./input";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Dialog } from "./dialog";
import { SplitPane } from "./split-pane";

describe("Dialog", () => {
  it("dims the page when it opens inside another dialog (a phone's detail view)", () => {
    setViewportWidth(390);
    render(
      <SplitPane
        list={<p>list</p>}
        detail={
          <Dialog open title="Delete this note?">
            <p>sure</p>
          </Dialog>
        }
        detailOpen
        detailLabel="Note"
        onDetailClose={() => undefined}
      />,
    );
    expect(document.querySelector(".anim-backdrop")).not.toBeNull();
  });
});

describe("Dialog placement right", () => {
  it("opens as a drawer docked to the right", async () => {
    render(<Dialog placement="right" defaultOpen title="Revisions" />);
    const popup = await screen.findByRole("dialog", { name: "Revisions" });
    expect(popup).toHaveAttribute("data-placement", "right");
    expect(popup.className).toContain("right-0");
    expect(popup.className).toContain("anim-slide-right");
  });
});

describe("Dialog", () => {
  it("opens from its trigger, is named, moves focus in, closes on Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog trigger={<Button>Open</Button>} title="Remove passkey" description="This cannot be undone." footer={<Button intent="danger">Remove</Button>}>
        <Input aria-label="Confirm" />
      </Dialog>,
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
    render(<Dialog defaultOpen onOpenChange={onOpenChange} title="Hello" />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
  it("is controlled by `open`", async () => {
    const { rerender } = render(<Dialog open={false} title="T" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Dialog open title="T" />);
    expect(await screen.findByRole("dialog", { name: "T" })).toBeInTheDocument();
  });
});

describe("Dialog placement", () => {
  it("centre is the default", async () => {
    render(<Dialog defaultOpen title="T" />);
    expect((await screen.findByRole("dialog")).getAttribute("data-placement")).toBe("center");
  });
  it("top places the panel near the top", async () => {
    render(<Dialog defaultOpen placement="top" title="T" />);
    const d = await screen.findByRole("dialog");
    expect(d).toHaveAttribute("data-placement", "top");
    expect(d.className).toContain("top-[15vh]");
    expect(d.className).toContain("max-w-lg");
  });
  it("bare has no close control and keeps the accessible name", async () => {
    render(<Dialog defaultOpen bare title="Palette"><input aria-label="Search" /></Dialog>);
    expect(await screen.findByRole("dialog", { name: "Palette" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
  it("can focus a chosen element on open", async () => {
    const ref = createRef<HTMLInputElement>();
    render(<Dialog defaultOpen bare title="P" initialFocus={ref}><input ref={ref} aria-label="Search" /></Dialog>);
    await waitFor(() => expect(screen.getByLabelText("Search")).toHaveFocus());
  });
});
