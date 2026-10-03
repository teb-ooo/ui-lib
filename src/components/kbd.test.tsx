import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Kbd } from "./kbd";

const down = (key: string, init: KeyboardEventInit = {}) => act(() => void fireEvent.keyDown(window, { key, ...init }));
const up = (key: string, init: KeyboardEventInit = {}) => act(() => void fireEvent.keyUp(window, { key, ...init }));
const pressed = () => Array.from(document.querySelectorAll("kbd")).filter((k) => k.hasAttribute("data-pressed")).map((k) => k.textContent);

describe("Kbd squares", () => {
  it("a single character is a square keycap: as tall as it is wide", () => {
    render(<Kbd shortcut="g" />);
    const cls = screen.getByText("G").className;
    expect(cls).toContain("h-6");
    expect(cls).toContain("min-w-6");
    expect(cls).toContain("leading-none");
  });
});

describe("Kbd reacts to the real keys", () => {
  it("a key looks pressed while it is down and not after", () => {
    render(<Kbd shortcut="mod+k" />);
    expect(pressed()).toEqual([]);
    down("k");
    expect(pressed()).toEqual(["K"]);
    up("k");
    expect(pressed()).toEqual([]);
  });

  it("each key of a chord reacts on its own, and modifiers by their name", () => {
    render(<Kbd shortcut="ctrl+shift+n" />);
    down("Control");
    down("Shift");
    expect(pressed()).toEqual(["Ctrl", "⇧"]);
    down("N");
    expect(pressed()).toEqual(["Ctrl", "⇧", "N"]);
    up("Control");
    up("Shift");
    up("N");
    expect(pressed()).toEqual([]);
  });

  it("arrows, enter and space match their key names, and every instance on the page reacts", () => {
    render(
      <>
        <Kbd shortcut="up" />
        <Kbd shortcut="enter" />
        <Kbd shortcut="space" />
        <Kbd>Esc</Kbd>
        <Kbd shortcut="enter" />
      </>,
    );
    down("ArrowUp");
    down("Enter");
    down(" ");
    down("Escape");
    expect(pressed()).toEqual(["↑", "↵", "Space", "Esc", "↵"]);
  });

  it("a lost window focus lets every key go (a keyup never arrives)", () => {
    render(<Kbd shortcut="g i" />);
    down("g");
    expect(pressed()).toEqual(["G"]);
    act(() => void window.dispatchEvent(new Event("blur")));
    expect(pressed()).toEqual([]);
  });

  it("with Command held a letter lets go by itself, and releasing Command lets go too", async () => {
    render(<Kbd shortcut="cmd+k" />);
    down("Meta", { metaKey: true });
    down("k", { metaKey: true });
    expect(pressed()).toEqual(["⌘", "K"]);
    await act(async () => new Promise((r) => setTimeout(r, 360)));
    expect(pressed()).toEqual(["⌘"]);
    up("Meta");
    expect(pressed()).toEqual([]);
  });

  it("stops listening when the last key leaves the page", () => {
    const { unmount } = render(<Kbd shortcut="k" />);
    down("k");
    unmount();
    render(<Kbd shortcut="j" />);
    expect(pressed()).toEqual([]);
  });
});

describe("Kbd chord box", () => {
  it("a chord is one box holding its keys, a single key is its own keycap", () => {
    const { container } = render(
      <>
        <Kbd shortcut="mod+shift+enter" />
        <Kbd shortcut="g" />
      </>,
    );
    const boxes = container.querySelectorAll("[data-complete], span.inline-flex.h-6");
    expect(container.querySelectorAll("kbd")).toHaveLength(4);
    const first = container.querySelector("[role=group] span span") as HTMLElement;
    expect(first.querySelectorAll("kbd")).toHaveLength(3);
    expect(boxes.length).toBeGreaterThan(0);
  });

  it("each key lights as it goes down and the box lights only when all are down", () => {
    const { container } = render(<Kbd shortcut="ctrl+shift+n" />);
    const box = container.querySelector("span.inline-flex.h-6") as HTMLElement;
    expect(box.hasAttribute("data-complete")).toBe(false);
    down("Control");
    down("Shift");
    expect(pressed()).toEqual(["Ctrl", "⇧"]);
    expect(box.hasAttribute("data-complete")).toBe(false);
    down("n");
    expect(box.hasAttribute("data-complete")).toBe(true);
    up("n");
    expect(box.hasAttribute("data-complete")).toBe(false);
    up("Control");
    up("Shift");
    expect(pressed()).toEqual([]);
  });

  it("a sequence has a box per chord step", () => {
    const { container } = render(<Kbd shortcut="g i" />);
    expect(container.querySelectorAll("span.inline-flex.h-6")).toHaveLength(0);
    expect(container.querySelectorAll("kbd")).toHaveLength(2);
  });
});
