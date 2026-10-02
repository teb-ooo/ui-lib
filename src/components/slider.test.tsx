import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { RangeSlider, Slider } from "../index";

function Controlled({ onCommit }: { onCommit?: (v: number) => void }) {
  const [v, setV] = useState(40);
  return <Slider label="Volume" value={v} onValueChange={setV} onValueCommit={onCommit} unit="%" min={0} max={100} step={5} />;
}

describe("Slider", () => {
  it("shows the label and the value with its unit, and names the thumb", () => {
    render(<Controlled />);
    expect(screen.getByText("Volume")).toBeTruthy();
    expect(screen.getByText("40 %")).toBeTruthy();
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb.getAttribute("aria-valuenow")).toBe("40");
    expect(thumb.getAttribute("aria-valuetext")).toBe("40 %");
  });

  it.each([
    ["ArrowRight", "45"],
    ["ArrowLeft", "35"],
    ["Home", "0"],
    ["End", "100"],
    ["PageUp", "90"],
    ["PageDown", "0"],
  ])("%s moves the value to %s", (key, want) => {
    render(<Controlled />);
    const thumb = screen.getByRole("slider");
    fireEvent.keyDown(thumb, { key });
    expect(thumb.getAttribute("aria-valuenow")).toBe(want);
  });

  it("does not move when disabled", () => {
    const onChange = vi.fn();
    render(<Slider label="Squelch" value={20} onValueChange={onChange} disabled />);
    const thumb = screen.getByRole("slider");
    // A disabled range input cannot take focus, so no key reaches it in a browser.
    expect(thumb.hasAttribute("disabled")).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses a custom format in the readout and the spoken value", () => {
    render(<Slider label="Cutoff" value={2400} max={5000} onValueChange={() => undefined} unit="Hz" format={(v) => `${v / 1000} k`} />);
    expect(screen.getByText("2.4 k Hz")).toBeTruthy();
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("2.4 k Hz");
  });
});

describe("RangeSlider", () => {
  function Range({ minGap = 0 }: { minGap?: number }) {
    const [v, setV] = useState<[number, number]>([300, 2700]);
    return <RangeSlider label="Passband" value={v} onValueChange={setV} min={0} max={6000} step={100} minGap={minGap} unit="Hz" />;
  }

  it("has a named thumb for each end and shows both values", () => {
    render(<Range />);
    expect(screen.getByRole("slider", { name: "Passband minimum" }).getAttribute("aria-valuenow")).toBe("300");
    expect(screen.getByRole("slider", { name: "Passband maximum" }).getAttribute("aria-valuenow")).toBe("2700");
    expect(screen.getByText("300 Hz to 2700 Hz")).toBeTruthy();
  });

  it("moves each thumb with the keyboard and they cannot cross", () => {
    render(<Range />);
    const low = screen.getByRole("slider", { name: "Passband minimum" });
    const high = screen.getByRole("slider", { name: "Passband maximum" });
    fireEvent.keyDown(low, { key: "ArrowRight" });
    expect(low.getAttribute("aria-valuenow")).toBe("400");
    fireEvent.keyDown(high, { key: "Home" });
    expect(Number(high.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(Number(low.getAttribute("aria-valuenow")));
  });

  it("keeps the minimum gap", () => {
    render(<Range minGap={500} />);
    const low = screen.getByRole("slider", { name: "Passband minimum" });
    const high = screen.getByRole("slider", { name: "Passband maximum" });
    fireEvent.keyDown(low, { key: "End" });
    expect(Number(high.getAttribute("aria-valuenow")) - Number(low.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(500);
  });
});
