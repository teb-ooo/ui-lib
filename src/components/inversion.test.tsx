import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Button } from "./button";
import { Combobox } from "./combobox";
import { Dialog } from "./dialog";
import { Select } from "./select";

const options = [
  { value: "a", label: "Ada" },
  { value: "g", label: "Grace" },
];

function Picked() {
  const [v, setV] = useState<string | null>("a");
  return <Select label="Owner" options={options} value={v} onValueChange={setV} />;
}

describe("dialogs, selects and comboboxes after the inversion", () => {
  it("a dialog is an inverted panel with a shaded header, a content area and a shaded footer", async () => {
    render(<Dialog defaultOpen title="Remove passkey" description="You will lose it." footer={<Button>Remove</Button>}>body</Dialog>);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("panel-inverse");
    const title = screen.getByText("Remove passkey");
    expect(title.parentElement?.className).toContain("bg-surface");
    expect(title.parentElement?.className).toContain("border-b");
    const footer = screen.getByRole("button", { name: "Remove" }).parentElement as HTMLElement;
    expect(footer.className).toContain("bg-surface");
    expect(footer.className).toContain("border-t");
    expect(screen.getByText("body").parentElement?.className).not.toContain("bg-surface");
  });

  it("a select's options have the mark at the end, so the text starts at the row's padding", async () => {
    const user = userEvent.setup();
    render(<Picked />);
    await user.click(screen.getByRole("combobox", { name: "Owner" }));
    const ada = await screen.findByRole("option", { name: /Ada/ });
    expect(ada.className).toContain("px-2");
    expect(ada.className).not.toContain("grid-cols");
    expect(ada.lastElementChild?.querySelector("svg")).not.toBeNull();
  });

  it("a select opened inside a forced-theme container draws its popup inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-theme="light">
        <Picked />
      </div>,
    );
    await user.click(screen.getByRole("combobox", { name: "Owner" }));
    await screen.findByRole("option", { name: /Ada/ });
    expect(container.querySelector('[data-theme="light"] [role="listbox"]')).not.toBeNull();
  });

  it("a combobox's empty message takes no space while there are matches", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Person" options={options} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Person" }));
    await waitFor(() => expect(screen.getAllByRole("option").length).toBe(2));
    const empty = document.querySelector("[class*='empty:hidden']") as HTMLElement | null;
    expect(empty?.textContent ?? "").toBe("");
  });
});
