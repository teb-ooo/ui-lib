import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "./color-picker";

function Harness({ start = "#ff0000", onCommit }: { start?: string; onCommit?: (v: string) => void }) {
  const [v, setV] = useState(start);
  return (
    <>
      <ColorPicker label="Stop colour" value={v} onValueChange={setV} onValueCommit={onCommit} />
      <output data-testid="out">{v}</output>
    </>
  );
}
const out = () => screen.getByTestId("out").textContent;

describe("ColorPicker", () => {
  it("is a named group with a square, a hue bar and a hex field showing the colour", () => {
    render(<Harness start="#336699" />);
    expect(screen.getByRole("group", { name: "Stop colour" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Saturation and brightness" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Hue" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Hex colour" })).toHaveProperty("value", "#336699");
  });

  it("the arrow keys move the square (Shift ten times as far) and the hue bar, and each is a committed change", () => {
    const commit = vi.fn();
    render(<Harness start="#ff0000" onCommit={commit} />);
    const square = screen.getByRole("slider", { name: "Saturation and brightness" });
    fireEvent.keyDown(square, { key: "ArrowDown", shiftKey: true });
    expect(out()).toBe("#e60000"); // brightness 0.9
    fireEvent.keyDown(square, { key: "ArrowLeft", shiftKey: true });
    expect(out()).not.toBe("#e60000");
    expect(commit).toHaveBeenCalledTimes(2);
    const hue = screen.getByRole("slider", { name: "Hue" });
    fireEvent.keyDown(hue, { key: "End" });
    expect(hue.getAttribute("aria-valuenow")).toBe("360");
    fireEvent.keyDown(hue, { key: "Home" });
    expect(hue.getAttribute("aria-valuenow")).toBe("0");
  });

  it("a pointer on the square sets saturation and brightness from where it lands", () => {
    render(<Harness start="#ff0000" />);
    const square = screen.getByRole("slider", { name: "Saturation and brightness" });
    square.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(square, { clientX: 0, clientY: 0, pointerId: 1 }); // top left: white
    expect(out()).toBe("#ffffff");
    fireEvent.pointerUp(square, { pointerId: 1 });
    fireEvent.pointerDown(square, { clientX: 100, clientY: 100, pointerId: 1 }); // bottom: black
    expect(out()).toBe("#000000");
  });

  it("keeps the hue when the colour passes through grey or black", () => {
    render(<Harness start="#00ff00" />);
    const square = screen.getByRole("slider", { name: "Saturation and brightness" });
    const hue = screen.getByRole("slider", { name: "Hue" });
    expect(hue.getAttribute("aria-valuenow")).toBe("120");
    for (let i = 0; i < 10; i += 1) fireEvent.keyDown(square, { key: "ArrowDown", shiftKey: true });
    expect(out()).toBe("#000000");
    expect(hue.getAttribute("aria-valuenow")).toBe("120");
  });

  it("the hex field applies a valid colour as you type, on Enter, and puts back the last good one when it is not", async () => {
    const user = userEvent.setup();
    const commit = vi.fn();
    render(<Harness start="#ff0000" onCommit={commit} />);
    const field = screen.getByRole("textbox", { name: "Hex colour" });
    await user.clear(field);
    await user.type(field, "#0af");
    expect(out()).toBe("#00aaff");
    await user.keyboard("{Enter}");
    expect(commit).toHaveBeenLastCalledWith("#00aaff");
    expect(field).toHaveProperty("value", "#00aaff");
    await user.clear(field);
    await user.type(field, "#12");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    await user.tab();
    expect(field).toHaveProperty("value", "#00aaff");
    expect(out()).toBe("#00aaff");
  });

  it("follows a value that changes from outside", () => {
    const { rerender } = render(<ColorPicker label="C" value="#ff0000" onValueChange={() => undefined} />);
    rerender(<ColorPicker label="C" value="#0000ff" onValueChange={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "Hex colour" })).toHaveProperty("value", "#0000ff");
    expect(screen.getByRole("slider", { name: "Hue" }).getAttribute("aria-valuenow")).toBe("240");
  });
});
