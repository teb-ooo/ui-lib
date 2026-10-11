import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import { RangeSlider, Slider } from "../index";
import { fineFactor, fineName } from "./fine-drag";

describe("slide-away speeds", () => {
  it("is full speed on the track and slower the further away, up or down", () => {
    expect(fineFactor(0)).toBe(1);
    expect(fineFactor(40)).toBe(1);
    expect(fineFactor(60)).toBe(0.5);
    expect(fineFactor(-120)).toBe(0.25);
    expect(fineFactor(300)).toBe(0.1);
    expect(fineName(0.5)).toBe("half speed");
    expect(fineName(0.1)).toBe("fine");
  });
});

// jsdom has no pointer capture; the slider's own drag (a mouse) calls it
Element.prototype.setPointerCapture = () => undefined;
Element.prototype.releasePointerCapture = () => undefined;
Element.prototype.hasPointerCapture = () => false;

function control(container: HTMLElement) {
  const c = container.querySelector<HTMLElement>("[data-fine-thumb]")!.closest<HTMLElement>("[class*='touch-none']")!;
  c.getBoundingClientRect = () => ({ left: 0, top: 100, width: 200, height: 28, right: 200, bottom: 128, x: 0, y: 100, toJSON: () => ({}) });
  return c;
}

function pointer(el: Element, type: "pointerDown" | "pointerMove" | "pointerUp", x: number, y: number, pointerType = "touch") {
  fireEvent[type](el, { pointerId: 1, pointerType, clientX: x, clientY: y, button: 0 });
}

function Harness({ onCommit, fineTuning }: { onCommit?: (v: number) => void; fineTuning?: boolean }) {
  const [v, setV] = useState(50);
  return <Slider label="Gain" value={v} onValueChange={setV} {...(onCommit ? { onValueCommit: onCommit } : {})} {...(fineTuning === false ? { fineTuning } : {})} />;
}

describe("Slider fine tuning", () => {
  it("a finger dragging the thumb moves it one-to-one on the track and slower the further it slides away", () => {
    const onCommit = vi.fn();
    const { container } = render(<Harness onCommit={onCommit} />);
    control(container);
    const thumb = container.querySelector("[data-fine-thumb]")!;
    pointer(thumb, "pointerDown", 100, 114);
    pointer(thumb, "pointerMove", 140, 114); // +40px of 200 = +20 at full speed
    expect(container.querySelector("output")?.textContent).toBe("70");
    pointer(thumb, "pointerMove", 180, 234); // 120px away: a quarter speed: +40px is +5
    expect(container.querySelector("output")?.textContent).toContain("75");
    expect(container.querySelector("output")?.textContent).toContain("quarter speed");
    pointer(thumb, "pointerUp", 180, 234);
    expect(onCommit).toHaveBeenLastCalledWith(75);
    expect(container.querySelector("output")?.textContent).toBe("75");
  });

  it("does not take a mouse drag, and can be turned off", () => {
    const { container } = render(<Harness fineTuning={false} />);
    control(container);
    const thumb = container.querySelector("[data-fine-thumb]")!;
    pointer(thumb, "pointerDown", 100, 114);
    pointer(thumb, "pointerMove", 140, 114);
    expect(container.querySelector("output")?.textContent).toBe("50");
    const second = render(<Harness />);
    const t2 = second.container.querySelector("[data-fine-thumb]")!;
    control(second.container);
    pointer(t2, "pointerDown", 100, 114, "mouse");
    pointer(t2, "pointerMove", 140, 114, "mouse");
    expect(second.container.querySelector("output")?.textContent).toBe("50");
  });

  it("a range thumb keeps its gap from the other thumb", () => {
    const onChange = vi.fn();
    const { container } = render(<RangeSlider label="Band" value={[20, 40]} minGap={10} onValueChange={onChange} />);
    control(container);
    const thumbs = container.querySelectorAll("[data-fine-thumb]");
    pointer(thumbs[0]!, "pointerDown", 40, 114);
    pointer(thumbs[0]!, "pointerMove", 190, 114); // would pass the high thumb
    expect(onChange).toHaveBeenLastCalledWith([30, 40]);
  });
});
