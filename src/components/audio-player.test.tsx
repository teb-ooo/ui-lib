import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AudioPlayer } from "./audio-player";

beforeAll(() => {
  const state = new WeakMap<HTMLMediaElement, boolean>();
  Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get() { return !state.get(this as HTMLMediaElement); } });
  HTMLMediaElement.prototype.play = vi.fn(function (this: HTMLMediaElement) {
    state.set(this, true);
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  HTMLMediaElement.prototype.pause = vi.fn(function (this: HTMLMediaElement) {
    state.set(this, false);
    this.dispatchEvent(new Event("pause"));
  });
});

describe("AudioPlayer", () => {
  it("is a named group with Play, a seek slider, the time and Mute", () => {
    render(<AudioPlayer src="a.wav" label="Recording: x" />);
    const g = screen.getByRole("group", { name: "Recording: x" });
    expect(g.textContent).toContain("0:00 / 0:00");
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mute" })).toBeTruthy();
  });

  it("toggles Play and Pause, shows the length, and mutes", () => {
    const { container } = render(<AudioPlayer src="a.wav" label="x" />);
    const el = container.querySelector("audio") as HTMLAudioElement;
    Object.defineProperty(el, "duration", { value: 45, configurable: true });
    fireEvent.loadedMetadata(el);
    expect(screen.getByRole("group", { name: "x" }).textContent).toContain("0:00 / 0:45");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy();
    expect(el.muted).toBe(true);
  });

  it("calls onEnded", () => {
    const ended = vi.fn();
    const { container } = render(<AudioPlayer src="a.wav" label="x" onEnded={ended} />);
    fireEvent.ended(container.querySelector("audio") as HTMLAudioElement);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("passes autoPlay to the audio element so the next part can start by itself", () => {
    const { container, rerender } = render(<AudioPlayer src="a.wav" label="x" />);
    expect((container.querySelector("audio") as HTMLAudioElement).autoplay).toBe(false);
    rerender(<AudioPlayer src="b.wav" label="x" autoPlay />);
    expect((container.querySelector("audio") as HTMLAudioElement).autoplay).toBe(true);
  });
});
