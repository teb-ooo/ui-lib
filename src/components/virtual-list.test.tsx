import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VirtualList } from "./virtual-list";
import type { VirtualListHandle } from "./virtual-list";

const items = Array.from({ length: 10_000 }, (_, i) => ({ id: `n${i}`, text: `Item ${i}` }));
const props = { label: "Things", items, itemKey: (x: { id: string }) => x.id, renderItem: (x: { text: string }) => <span>{x.text}</span> };

describe("VirtualList", () => {
  it("draws only the items on screen, and tells assistive technology the whole length", () => {
    render(<VirtualList {...props} itemHeight={30} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.length).toBeLessThan(40);
    expect(rows[0]!.getAttribute("aria-setsize")).toBe("10000");
    expect(rows[0]!.getAttribute("aria-posinset")).toBe("1");
    expect(screen.getByRole("list", { name: "Things" })).toBeTruthy();
    // the scroll area is as tall as the whole list
    const inner = screen.getByRole("list").firstElementChild as HTMLElement;
    expect(inner.style.height).toBe("300000px");
  });

  it("draws the window that a scroll lands on", () => {
    render(<VirtualList {...props} itemHeight={30} />);
    const list = screen.getByRole("list");
    fireEvent.scroll(list, { target: { scrollTop: 30000 } });
    expect(screen.getByText("Item 1000")).toBeTruthy();
    expect(screen.queryByText("Item 0")).toBeNull();
  });

  it("scrollToIndex puts the item in view", () => {
    const ref = createRef<VirtualListHandle>();
    render(<VirtualList {...props} itemHeight={30} ref={ref} />);
    const list = screen.getByRole("list");
    ref.current!.scrollToIndex(500, "start");
    expect(list.scrollTop).toBe(15000);
  });

  it("measured mode (no itemHeight) uses the estimate until an item is measured", () => {
    render(<VirtualList {...props} estimatedItemHeight={40} />);
    const inner = screen.getByRole("list").firstElementChild as HTMLElement;
    expect(inner.style.height).toBe("400000px");
    expect(screen.getAllByRole("listitem").length).toBeLessThan(40);
  });

  it("asks for more once when the scroll nears the end, and shows the empty state", () => {
    const more = vi.fn();
    const few = items.slice(0, 20);
    const { rerender } = render(<VirtualList {...props} items={few} itemHeight={30} onEndReached={more} />);
    expect(more).toHaveBeenCalledTimes(1); // 600px of items in a 400px view: the end is within the threshold of 240
    rerender(<VirtualList {...props} items={few} itemHeight={30} onEndReached={more} />);
    expect(more).toHaveBeenCalledTimes(1);
    rerender(<VirtualList {...props} items={[] as typeof items} itemHeight={30} empty={<p>Nothing here</p>} />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});
