import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { FilePicker } from "./file-picker";
import type { FilePickerHandle } from "./file-picker";

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
