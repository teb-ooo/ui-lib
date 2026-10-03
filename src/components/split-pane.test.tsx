import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SplitPane } from "./split-pane";

const KEY = "teb-ui:split-pane:sp";
const pane = (props: Partial<React.ComponentProps<typeof SplitPane>> = {}) => (
  <SplitPane list={<p>list</p>} detail={<p>detail</p>} detailOpen detailLabel="Detail" onDetailClose={() => undefined} resizable defaultSize={20} minSize={10} maxSize={30} {...props} />
);
const listWidth = () => (screen.getByText("list").parentElement as HTMLElement).style.width;

describe("SplitPane persistKey", () => {
  it("restores the saved width within min and max, saves on keyboard moves, and resets on double-click", () => {
    window.localStorage.setItem(KEY, "50");
    const { unmount } = render(pane({ persistKey: "sp" }));
    // wide screens only: the default test viewport is 1024px wide, which is the lg breakpoint
    expect(listWidth()).toBe("30rem");
    unmount();
    window.localStorage.setItem(KEY, "12");
    render(pane({ persistKey: "sp" }));
    expect(listWidth()).toBe("12rem");
    const divider = screen.getByRole("separator", { name: "Resize list" });
    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(listWidth()).toBe("13rem");
    expect(window.localStorage.getItem(KEY)).toBe("13");
    fireEvent.doubleClick(divider);
    // back to the responsive width: the default (20rem) up to 38% of the pane, no more than maxSize
    expect(listWidth()).toBe("clamp(20rem, 38%, 30rem)");
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("without persistKey nothing is stored, and onSizeChange still fires", () => {
    window.localStorage.clear();
    const onSizeChange = vi.fn();
    render(pane({ onSizeChange }));
    fireEvent.keyDown(screen.getByRole("separator", { name: "Resize list" }), { key: "ArrowLeft" });
    expect(onSizeChange).toHaveBeenCalledWith(19);
    expect(window.localStorage.length).toBe(0);
  });
});

describe("SplitPane responsive width", () => {
  it("grows with the screen until the divider is moved", () => {
    render(pane({ resizable: true }));
    expect(listWidth()).toBe("clamp(20rem, 38%, 30rem)");
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
    expect(listWidth()).toBe("21rem");
  });
});
