import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FilePicker } from "./file-picker";
import type { FilePickerHandle } from "./file-picker";
import { Switch } from "./switch";

describe("Switch", () => {
  it("is a switch named by its label, reports changes and describes itself", () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Email me" description="Once a day" checked={false} onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole("switch", { name: "Email me" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.click(sw);
    expect(onCheckedChange.mock.lastCall?.[0]).toBe(true);
  });
  it("does not change when disabled", () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Locked" disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "Locked" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("FilePicker", () => {
  const pick = (container: HTMLElement, files: File[]) => {
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: files, configurable: true });
    fireEvent.change(input);
    return input;
  };
  it("reports the chosen files and resets so the same file can be chosen again", () => {
    const onFiles = vi.fn();
    const { container } = render(<FilePicker onFiles={onFiles}>Choose</FilePicker>);
    const f = new File(["x"], "a.png", { type: "image/png" });
    const input = pick(container, [f]);
    expect(onFiles).toHaveBeenCalledWith([f]);
    expect(input.value).toBe("");
  });
  it("ignores an empty choice, and open() clicks the hidden input", () => {
    const onFiles = vi.fn();
    const ref = createRef<FilePickerHandle>();
    const { container } = render(<FilePicker ref={ref} onFiles={onFiles}>Choose</FilePicker>);
    pick(container, []);
    expect(onFiles).not.toHaveBeenCalled();
    const input = container.querySelector("input[type=file]") as HTMLInputElement;
    const click = vi.spyOn(input, "click");
    ref.current?.open();
    expect(click).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Choose" }));
    expect(click).toHaveBeenCalledTimes(2);
  });
});
