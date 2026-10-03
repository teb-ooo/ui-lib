import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FrequencyInput, formatKhz } from "../index";
import { typeInto } from "./frequency-input";

function Tuner({ start = 740, onCommit, ...rest }: { start?: number; onCommit?: (v: number) => void; min?: number; max?: number; dimmed?: boolean }) {
  const [v, setV] = useState(start);
  return <FrequencyInput value={v} onValueChange={setV} onValueCommit={onCommit} {...rest} />;
}

describe("formatKhz", () => {
  it.each([
    [740, "00740.00"],
    [10000, "10000.00"],
    [7074.5, "07074.50"],
    [0.01, "00000.01"],
    [30000, "30000.00"],
  ])("%d is %s", (v, text) => {
    expect(formatKhz(v)).toBe(text);
  });
});

describe("typeInto", () => {
  const blank = "       ";
  it("the first digit clears to blanks and digits fill from the left, skipping the point: 7 0 7 4 is 7074.00", () => {
    let s = { digits: "0074000", pos: 0, fresh: true };
    for (const k of ["7", "0", "7", "4"]) s = typeInto(s, k);
    expect(s.digits).toBe("7074   ");
    expect(s.pos).toBe(4);
  });
  it("a fifth digit goes before the point and further digits fill the decimals", () => {
    let s = { digits: blank, pos: 0, fresh: false };
    for (const k of ["1", "2", "3", "4", "5", "6", "7"]) s = typeInto(s, k);
    expect(s.digits).toBe("1234567");
    expect(s.pos).toBe(7);
    // nothing after the seventh slot
    expect(typeInto(s, "9").digits).toBe("1234567");
  });
  it("ignores the point and other keys", () => {
    const s = { digits: "7074   ", pos: 4, fresh: false };
    expect(typeInto(s, ".")).toBe(s);
    expect(typeInto(s, "a")).toBe(s);
  });
  it("Backspace blanks the slot before the caret, Delete the slot at it, the arrows move the caret", () => {
    expect(typeInto({ digits: "7074   ", pos: 4, fresh: false }, "Backspace")).toMatchObject({ digits: "707    ", pos: 3 });
    expect(typeInto({ digits: "1234567", pos: 3, fresh: false }, "Delete")).toMatchObject({ digits: "123 567", pos: 3 });
    expect(typeInto({ digits: "1234567", pos: 3, fresh: false }, "ArrowLeft").pos).toBe(2);
    expect(typeInto({ digits: "1234567", pos: 3, fresh: false }, "End").pos).toBe(7);
  });
});

describe("FrequencyInput", () => {
  it("shows the readout zero-padded as a spin button with its limits", () => {
    render(<Tuner />);
    const n = screen.getByRole("spinbutton", { name: "Frequency" });
    expect(n.textContent).toBe("00740.00");
    expect(n.getAttribute("aria-valuenow")).toBe("740");
    expect(n.getAttribute("aria-valuemax")).toBe("30000");
    expect(n.getAttribute("aria-valuetext")).toBe("00740.00 kilohertz");
  });

  it("the arrow keys step it, Shift steps finely, PageUp ten steps, and each is committed", () => {
    const onCommit = vi.fn();
    render(<Tuner onCommit={onCommit} />);
    const n = screen.getByRole("spinbutton");
    fireEvent.keyDown(n, { key: "ArrowUp" });
    expect(n.textContent).toBe("00741.00");
    fireEvent.keyDown(n, { key: "ArrowDown", shiftKey: true });
    expect(n.textContent).toBe("00740.99");
    fireEvent.keyDown(n, { key: "PageUp" });
    expect(n.textContent).toBe("00750.99");
    expect(onCommit).toHaveBeenLastCalledWith(750.99);
  });

  it("stays inside its range", () => {
    render(<Tuner start={29999.5} max={30000} />);
    const n = screen.getByRole("spinbutton");
    fireEvent.keyDown(n, { key: "ArrowUp" });
    expect(n.textContent).toBe("30000.00");
    fireEvent.keyDown(n, { key: "ArrowUp" });
    expect(n.textContent).toBe("30000.00");
  });

  it("clicking opens the masked editor with everything selected; typing sets a value; Enter sets it and closes", async () => {
    const onCommit = vi.fn();
    render(<Tuner onCommit={onCommit} />);
    await userEvent.click(screen.getByRole("spinbutton"));
    const field = screen.getByRole("textbox", { name: "Frequency in kHz" }) as HTMLInputElement;
    expect(field.value).toBe("00740.00");
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(field.value.length);
    await userEvent.keyboard("7074");
    expect(field.value).toBe("7074 .  ");
    await userEvent.keyboard("{Enter}");
    expect(onCommit).toHaveBeenCalledWith(7074);
    expect(screen.getByRole("spinbutton").textContent).toBe("07074.00");
  });

  it("the Set frequency button sets it, and is disabled for a value outside the range", async () => {
    const onCommit = vi.fn();
    render(<Tuner onCommit={onCommit} max={10000} />);
    await userEvent.click(screen.getByRole("spinbutton"));
    await userEvent.keyboard("0");
    // 0 kHz is not valid
    expect((screen.getByRole("button", { name: "Set frequency" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.keyboard("{Home}99999");
    // 99999 kHz is above the maximum too
    expect((screen.getByRole("button", { name: "Set frequency" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.keyboard("{Enter}");
    // an invalid value: Enter only closes the editor
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.click(screen.getByRole("spinbutton"));
    await userEvent.keyboard("1000");
    expect((screen.getByRole("button", { name: "Set frequency" }) as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Set frequency" }));
    expect(onCommit).toHaveBeenCalledWith(1000);
  });

  it("Escape cancels and a press outside cancels, neither sets", async () => {
    const onCommit = vi.fn();
    render(
      <div>
        <button type="button">Elsewhere</button>
        <Tuner onCommit={onCommit} />
      </div>,
    );
    await userEvent.click(screen.getByRole("spinbutton"));
    await userEvent.keyboard("1000{Escape}");
    expect(screen.getByRole("spinbutton").textContent).toBe("00740.00");
    await userEvent.click(screen.getByRole("spinbutton"));
    await userEvent.keyboard("1000");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("spinbutton").textContent).toBe("00740.00");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("the knob changes the value as it is dragged: 0.5 kHz per pixel snapped to 0.05, live, committed once at the end", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(<FrequencyInput value={100} onValueChange={onChange} onValueCommit={onCommit} />);
    const knob = screen.getByRole("slider");
    fireEvent.pointerDown(knob, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(knob, { clientX: 110, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(105);
    fireEvent.pointerMove(knob, { clientX: 90, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(95);
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerUp(knob, { pointerId: 1 });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("Shift tunes finely: 0.003 kHz per pixel snapped to 0.01", () => {
    const onChange = vi.fn();
    render(<FrequencyInput value={100} onValueChange={onChange} />);
    const knob = screen.getByRole("slider");
    fireEvent.pointerDown(knob, { clientX: 0, pointerId: 1, shiftKey: true });
    fireEvent.pointerMove(knob, { clientX: 10, pointerId: 1, shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(100.03);
  });

  it("the knob stays inside the range and turns 2 degrees per pixel", () => {
    const onChange = vi.fn();
    const { container } = render(<FrequencyInput value={29999} onValueChange={onChange} max={30000} />);
    const knob = screen.getByRole("slider");
    fireEvent.pointerDown(knob, { clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(knob, { clientX: 100, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(30000);
    const dial = container.querySelector("svg g") as SVGElement;
    expect(dial.style.transform).toBe("rotate(200deg)");
  });

  it("dimmed is inert and optimistic is drawn at half opacity", () => {
    const { container, rerender } = render(<FrequencyInput value={740} onValueChange={() => undefined} dimmed />);
    expect(container.firstElementChild?.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(screen.getByRole("spinbutton"));
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(<FrequencyInput value={740} onValueChange={() => undefined} optimistic />);
    expect(container.querySelector(".opacity-50")).not.toBeNull();
  });

  it("disabled is inert like dimmed but at half opacity", () => {
    const { container } = render(<FrequencyInput value={740} onValueChange={() => undefined} disabled />);
    expect(container.firstElementChild?.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(screen.getByRole("spinbutton"));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(container.firstElementChild?.className).toContain("opacity-50");
  });

  it("playbackMode recolours the readout", () => {
    render(<FrequencyInput value={740} onValueChange={() => undefined} playbackMode />);
    expect(screen.getByRole("spinbutton").className).toContain("text-warning");
  });
});
