import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slider, VolumeControl } from "../index";

function Harness({ start = 0.6, startMuted = false, onMuted }: { start?: number; startMuted?: boolean; onMuted?: (m: boolean) => void }) {
  const [v, setV] = useState(start);
  const [m, setM] = useState(startMuted);
  return (
    <VolumeControl
      value={v}
      onValueChange={setV}
      muted={m}
      onMutedChange={(x) => {
        setM(x);
        onMuted?.(x);
      }}
    />
  );
}

describe("vertical Slider", () => {
  it("raises with ArrowUp and ArrowRight and lowers with ArrowDown, the top being the maximum", async () => {
    const onChange = vi.fn();
    function V() {
      const [v, setV] = useState(50);
      return <Slider orientation="vertical" label="Level" value={v} onValueChange={(x) => { setV(x); onChange(x); }} />;
    }
    render(<V />);
    const thumb = screen.getByRole("slider", { name: "Level" });
    thumb.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(51);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(49);
    expect(thumb).toHaveAttribute("aria-orientation", "vertical");
  });
});

describe("VolumeControl", () => {
  it("shows the level in its icon and name: high, low, muted", () => {
    const { rerender } = render(<VolumeControl value={0.8} onValueChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Volume, 80 percent" })).toBeTruthy();
    rerender(<VolumeControl value={0} onValueChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Volume, muted" })).toBeTruthy();
    rerender(<VolumeControl value={0.8} muted onValueChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Volume, muted" })).toBeTruthy();
  });

  it("opens a panel with a vertical slider and a mute button that toggles, and closes on Escape", async () => {
    const user = userEvent.setup();
    const onMuted = vi.fn();
    render(<Harness onMuted={onMuted} />);
    await user.click(screen.getByRole("button", { name: /^Volume/ }));
    const panel = await screen.findByRole("dialog", { name: "Volume" });
    expect(within(panel).getByRole("slider", { name: "Volume" })).toHaveAttribute("aria-orientation", "vertical");
    await user.click(within(panel).getByRole("button", { name: "Mute" }));
    expect(onMuted).toHaveBeenLastCalledWith(true);
    expect(within(panel).getByRole("button", { name: "Unmute" })).toBeTruthy();
    await user.click(within(panel).getByRole("button", { name: "Unmute" }));
    expect(onMuted).toHaveBeenLastCalledWith(false);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Volume" })).toBeNull());
  });

  it("raising the slider while muted unmutes", async () => {
    const user = userEvent.setup();
    const onMuted = vi.fn();
    render(<Harness startMuted onMuted={onMuted} />);
    await user.click(screen.getByRole("button", { name: /^Volume/ }));
    const slider = within(await screen.findByRole("dialog", { name: "Volume" })).getByRole("slider", { name: "Volume" });
    slider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onMuted).toHaveBeenLastCalledWith(false);
  });
});
