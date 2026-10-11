import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField } from "./date-field";

function Harness({ initial = null, min, max, onChange }: { initial?: string | null; min?: string; max?: string; onChange?: (v: string | null) => void }) {
  const [v, setV] = useState<string | null>(initial);
  return (
    <DateField
      label="Due"
      value={v}
      {...(min ? { min } : {})}
      {...(max ? { max } : {})}
      onValueChange={(x) => {
        setV(x);
        onChange?.(x);
      }}
    />
  );
}

describe("DateField", () => {
  it("shows the date in the person's locale and takes YYYY-MM-DD while it is edited", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Due" });
    expect((box as HTMLInputElement).value).toMatch(/2026/);
    await user.click(box);
    expect((box as HTMLInputElement).value).toBe("2026-10-11");
    await user.clear(box);
    await user.type(box, "2026-12-24");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith("2026-12-24");
  });

  it("does not take a date that is not real or is outside the limits, and says so", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" min="2026-10-01" max="2026-10-31" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Due" });
    await user.click(box);
    await user.clear(box);
    await user.type(box, "2026-11-02");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(await screen.findByRole("alert")).toHaveTextContent("YYYY-MM-DD");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears when the box is emptied", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Due" });
    await user.click(box);
    await user.clear(box);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("opens a calendar on the chosen month with the chosen day focused, and picking a day sets it and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Choose date" }));
    const grid = await screen.findByRole("grid");
    expect(grid).toHaveAccessibleName(/October 2026/);
    await waitFor(() => expect(within(grid).getByRole("button", { name: /October 11, 2026/ })).toHaveFocus());
    await user.click(within(grid).getByRole("button", { name: /October 20, 2026/ }));
    expect(onChange).toHaveBeenLastCalledWith("2026-10-20");
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull());
  });

  it("moves with the arrow keys by a day and a week, Page Down by a month, and Enter picks", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("grid");
    await waitFor(() => expect(screen.getByRole("button", { name: /October 11, 2026/ })).toHaveFocus());
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("button", { name: /October 12, 2026/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("button", { name: /October 19, 2026/ })).toHaveFocus());
    await user.keyboard("{PageDown}");
    await waitFor(() => expect(screen.getByRole("grid")).toHaveAccessibleName(/November 2026/));
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("2026-11-19");
  });

  it("disables days outside min and max, and Clear empties the field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-10-11" min="2026-10-05" max="2026-10-25" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Choose date" }));
    const grid = await screen.findByRole("grid");
    expect(within(grid).getByRole("button", { name: /October 4, 2026/ })).toBeDisabled();
    expect(within(grid).getByRole("button", { name: /October 26, 2026/ })).toBeDisabled();
    expect(within(grid).getByRole("button", { name: /October 5, 2026/ })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
