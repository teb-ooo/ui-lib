import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Combobox } from "./combobox";
import { Field } from "./field";
import { Input } from "./input";
import { NumberField } from "./number-field";
import { Select } from "./select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("adornments", () => {
  it("Input: the adornment sits inside the box, is hidden from assistive technology, and the label still names the input", async () => {
    const { container } = render(
      <Field label="Low edge" hideLabel>
        <Input startAdornment="LO" endAdornment="Hz" />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Low edge" });
    const box = input.parentElement as HTMLElement;
    expect(box.className).toContain("input");
    expect(box.textContent).toBe("LOHz");
    for (const text of ["LO", "Hz"]) expect(screen.getByText(text).getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll(".input")).toHaveLength(1); // the box carries the border, not the input inside it
    // pressing on the adornment focuses the input, as pressing a label would
    await userEvent.click(screen.getByText("LO"));
    expect(document.activeElement).toBe(input);
  });

  it("Input without an adornment is exactly the plain input it was", () => {
    render(<Input aria-label="Plain" />);
    const input = screen.getByRole("textbox", { name: "Plain" });
    expect(input.className).toContain("input");
    expect(input.parentElement?.className ?? "").not.toContain("input");
  });

  it("Input: a forwarded ref reaches the input, and typing works", async () => {
    let got: HTMLInputElement | null = null;
    render(<Input aria-label="Price" startAdornment="$" ref={(n) => void (got = n)} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Price" }), "12");
    expect((got as HTMLInputElement | null)?.value).toBe("12");
  });

  it("NumberField: an adornment before the number and the unit after it, the hidden label still names it, and the number still commits", async () => {
    let committed: number | null = null;
    render(<NumberField label="Low edge" hideLabel startAdornment="LO" unit="Hz" value={300} onValueChange={() => undefined} onValueCommit={(v) => (committed = v)} steppers={false} />);
    const input = screen.getByRole("textbox", { name: /Low edge/ });
    const box = input.parentElement as HTMLElement;
    expect(box.textContent).toBe("LOHz");
    await userEvent.click(input);
    await userEvent.keyboard("{Enter}");
    expect(committed).toBe(300);
  });

  it("Select: an adornment before the value, the select keeps its name", () => {
    render(<Select label="Status" startAdornment="IS" options={options} value="a" onValueChange={() => undefined} />);
    const trigger = screen.getByRole("combobox", { name: "Status" });
    expect(trigger.textContent).toContain("IS");
    expect(trigger.textContent).toContain("Alpha");
    expect(screen.getByText("IS").getAttribute("aria-hidden")).toBe("true");
  });

  it("Combobox: single and multiple draw the adornment and keep the input's name", () => {
    const { unmount } = render(<Combobox label="Assignee" startAdornment="TO" options={options} value={null} onValueChange={() => undefined} />);
    expect(screen.getByRole("combobox", { name: "Assignee" }).parentElement?.textContent).toContain("TO");
    unmount();
    render(<Combobox multiple label="Assignees" startAdornment="TO" endAdornment="x" options={options} value={["a"]} onValueChange={() => undefined} />);
    expect(screen.getByRole("combobox", { name: "Assignees" })).toBeTruthy();
    expect(screen.getByText("TO").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Alpha")).toBeTruthy();
  });
});
