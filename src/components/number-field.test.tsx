import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { NumberField } from "../index";

function Controlled({ onCommit, ...rest }: { onCommit?: (v: number | null) => void; min?: number; max?: number; step?: number; unit?: string; steppers?: boolean }) {
  const [v, setV] = useState<number | null>(10);
  return <NumberField label="Frequency" value={v} onValueChange={setV} onValueCommit={onCommit} {...rest} />;
}

describe("NumberField", () => {
  it("has a labelled input showing the value, and an optional unit", () => {
    render(<Controlled unit="kHz" />);
    const input = screen.getByRole("textbox", { name: "Frequency" }) as HTMLInputElement;
    expect(input.value).toBe("10");
    expect(screen.getByText("kHz")).toBeTruthy();
  });

  it("steps with the arrow keys, by ten with Shift, and to the limits with Home and End", () => {
    render(<Controlled min={0} max={100} />);
    const input = screen.getByRole("textbox", { name: "Frequency" }) as HTMLInputElement;
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("11");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("9");
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
    expect(input.value).toBe("19");
    fireEvent.keyDown(input, { key: "End" });
    expect(input.value).toBe("100");
    fireEvent.keyDown(input, { key: "Home" });
    expect(input.value).toBe("0");
  });

  it("has minus and plus buttons that step, and respects min and max", async () => {
    render(<Controlled min={9} max={11} />);
    const input = screen.getByRole("textbox", { name: "Frequency" }) as HTMLInputElement;
    await userEvent.click(screen.getByRole("button", { name: "Increase" }));
    await userEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(input.value).toBe("11");
    await userEvent.click(screen.getByRole("button", { name: "Decrease" }));
    await userEvent.click(screen.getByRole("button", { name: "Decrease" }));
    await userEvent.click(screen.getByRole("button", { name: "Decrease" }));
    expect(input.value).toBe("9");
  });

  it("can leave the steppers out", () => {
    render(<Controlled steppers={false} />);
    expect(screen.queryByRole("button", { name: "Increase" })).toBeNull();
  });

  it("reports changes while typing and commits on Enter and on blur", async () => {
    const onCommit = vi.fn();
    render(<Controlled onCommit={onCommit} />);
    const input = screen.getByRole("textbox", { name: "Frequency" }) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "42{Enter}");
    expect(onCommit.mock.calls, JSON.stringify(onCommit.mock.calls)).toContainEqual([42]);
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith(7);
  });

  it("is inert when disabled", () => {
    render(<NumberField label="Squelch" value={20} onValueChange={() => undefined} disabled />);
    expect((screen.getByRole("textbox", { name: "Squelch" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Increase" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
