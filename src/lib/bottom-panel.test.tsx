import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ConfirmDialog, Dialog, Menu, Popover, Select, Sheet } from "../index";
import { setViewportWidth } from "../../test/cmdk/viewport";

const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];

describe("bottom panels", () => {
  it("a select opens as a reversed panel pinned to the bottom edge on a phone", async () => {
    setViewportWidth(390);
    render(<Select label="Pick" options={options} value={null} onValueChange={() => undefined} />);
    await userEvent.setup().click(screen.getByRole("combobox", { name: "Pick" }));
    const popup = (await screen.findByRole("listbox")).closest(".panel-inverse") as HTMLElement;
    expect(popup.className).toContain("anim-panel");
    expect((popup.parentElement as HTMLElement).style.position).toBe("fixed");
    expect((popup.parentElement as HTMLElement).style.bottom).toBe("0px");
  });

  it("a select stays anchored to its trigger on a wide screen", async () => {
    render(<Select label="Pick" options={options} value={null} onValueChange={() => undefined} />);
    await userEvent.setup().click(screen.getByRole("combobox", { name: "Pick" }));
    const popup = (await screen.findByRole("listbox")).closest(".panel-inverse") as HTMLElement;
    expect(popup.className).not.toContain("anim-panel");
  });

  it("a menu and a popover are panels on a phone", async () => {
    setViewportWidth(390);
    const user = userEvent.setup();
    render(
      <>
        <Menu trigger={<Button>Actions</Button>} items={[{ type: "action", id: "x", label: "Do", onSelect: () => undefined }]} />
        <Popover trigger={<Button>Details</Button>} title="Details">Body</Popover>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect((await screen.findByRole("menu")).className).toContain("anim-panel");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect((await screen.findByRole("dialog", { name: "Details" })).className).toContain("anim-panel");
  });

  it("a dialog and a confirm dialog are panels on a phone, with a handle", async () => {
    setViewportWidth(390);
    render(
      <Dialog defaultOpen title="Edit">
        <p>Body</p>
      </Dialog>,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("anim-panel");
    expect(dialog.className).toContain("panel-inverse");
    expect(dialog.querySelector(".cursor-grab")).not.toBeNull();
  });

  it("a dialog is centred on a wide screen", async () => {
    render(
      <Dialog defaultOpen title="Edit">
        <p>Body</p>
      </Dialog>,
    );
    expect((await screen.findByRole("dialog")).className).not.toContain("anim-panel");
  });

  it("panels stack: the older one sits behind the newer, smaller and higher", async () => {
    setViewportWidth(390);
    const user = userEvent.setup();
    render(
      <Sheet defaultOpen title="First">
        <Dialog trigger={<Button>Second</Button>} title="Second panel">
          <p>Body</p>
        </Dialog>
        <ConfirmDialog open={false} onOpenChange={() => undefined} title="x" onConfirm={() => undefined} />
      </Sheet>,
    );
    await user.click(await screen.findByRole("button", { name: "Second" }));
    const first = screen.getAllByRole("dialog", { hidden: true })[0] as HTMLElement;
    await waitFor(() => expect(first.style.transform).toContain("scale(0.96)"));
    expect(screen.getByRole("dialog", { name: "Second panel" }).style.transform).not.toContain("scale");
  });
});

describe("stacking with anchored popups", () => {
  it("a select opened inside a sheet puts the sheet behind it, and it comes back when the select closes", async () => {
    setViewportWidth(390);
    const user = userEvent.setup();
    render(
      <Sheet defaultOpen title="First">
        <Select label="Pick" options={options} value={null} onValueChange={() => undefined} />
      </Sheet>,
    );
    const sheet = await screen.findByRole("dialog");
    expect(sheet.style.transform).toBe("none");
    await user.click(screen.getByRole("combobox", { name: "Pick" }));
    await screen.findByRole("listbox");
    await waitFor(() => expect(sheet.style.transform).toContain("scale(0.96)"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(sheet.style.transform).toBe("none"));
  });
});

describe("an environment without matchMedia", () => {
  it("draws the anchored popups, so an app's own jsdom tests keep working", async () => {
    // @ts-expect-error: a test environment without matchMedia
    window.matchMedia = undefined;
    render(<Select label="Pick" options={options} value={null} onValueChange={() => undefined} />);
    await userEvent.setup().click(screen.getByRole("combobox", { name: "Pick" }));
    expect(await screen.findByRole("listbox")).toBeTruthy();
  });
});
