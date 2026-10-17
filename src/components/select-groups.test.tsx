import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../index";
import type { Option } from "./select";

const options: Option[] = [
  { value: "median", label: "Median", group: "Denoise" },
  { value: "bilateral", label: "Bilateral", group: "Denoise" },
  { value: "unsharp", label: "Unsharp", group: "Sharpen", tip: "Sharpens edges." },
  { value: "deblur", label: "Deblur", group: "Sharpen", disabled: true, tip: "At most 8 filters." },
  { value: "gamma", label: "Gamma", group: "Exponent" },
];

describe("Select option groups and disabled options", () => {
  it("draws consecutive options under a heading, exposed as a named group", async () => {
    const user = userEvent.setup();
    render(<Select label="Add a filter" placeholder="Add a filter" options={options} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Add a filter" }));
    const denoise = await screen.findByRole("group", { name: "Denoise" });
    expect(within(denoise).getByRole("option", { name: "Bilateral" })).toBeTruthy();
    expect(within(screen.getByRole("group", { name: "Sharpen" })).getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Exponent" })).toBeTruthy();
  });

  it("the arrow keys skip headings; a disabled option can be reached, is inert and still reports its highlight and tip", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    const onChange = vi.fn();
    render(<Select label="Add a filter" placeholder="Add a filter" options={options} value={null} onValueChange={onChange} onHighlight={onHighlight} />);
    await user.click(screen.getByRole("combobox", { name: "Add a filter" }));
    await screen.findByRole("group", { name: "Denoise" });
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}"); // median, bilateral, unsharp, deblur: the headings are skipped
    await waitFor(() => expect(onHighlight).toHaveBeenLastCalledWith("deblur"));
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("At most 8 filters."));
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    const deblur = screen.getByRole("option", { name: /Deblur/ });
    expect(deblur).toHaveAttribute("data-disabled");
    expect(deblur).toHaveTextContent("unavailable");
  });

  it("with value null it is an action dropdown: choosing calls onValueChange and the trigger keeps its placeholder", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onHighlight = vi.fn();
    render(<Select label="Add a filter" placeholder="Add a filter" options={options} value={null} onValueChange={onChange} onHighlight={onHighlight} />);
    const trigger = screen.getByRole("combobox", { name: "Add a filter" });
    expect(trigger).toHaveTextContent("Add a filter");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Median" }));
    expect(onChange).toHaveBeenCalledWith("median", expect.anything());
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(trigger).toHaveTextContent("Add a filter");
    expect(onHighlight).toHaveBeenLastCalledWith(null);
  });
});

describe("Select group headings and option tips", () => {
  it("a heading is a step lighter than the options (ink-muted, upper case)", async () => {
    const user = userEvent.setup();
    render(<Select label="Add a filter" placeholder="Add a filter" options={options} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Add a filter" }));
    const heading = await screen.findByText("Denoise");
    expect(heading.className).toContain("text-ink-muted");
    expect(heading.className).toContain("uppercase");
  });

  it("a tip carries an arrow that points at its option", async () => {
    const user = userEvent.setup();
    render(<Select label="Add a filter" placeholder="Add a filter" options={options} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Add a filter" }));
    await screen.findByRole("group", { name: "Sharpen" });
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    const tip = await screen.findByRole("tooltip");
    const arrow = tip.querySelector(".popover-arrow");
    expect(arrow).not.toBeNull();
    expect(arrow?.getAttribute("data-side")).toMatch(/left|right|top|bottom/);
  });
});
