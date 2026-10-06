import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaGrid } from "./media-grid";
import type { MediaItem } from "./media-grid";

const items: MediaItem[] = [
  { id: "a", src: "/a.jpg", alt: "Beach", caption: "alex" },
  { id: "b", src: "/b.jpg", kind: "video", duration: 75, caption: "sam" },
  { id: "c", src: "/c.jpg", kind: "audio", duration: "0:09" },
];

describe("MediaGrid", () => {
  it("draws a tile per item with its name, caption, kind and length", () => {
    render(<MediaGrid label="Photos" items={items} />);
    expect(screen.getByRole("list", { name: "Photos" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Beach" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "sam, video, 1:15" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audio, audio, 0:09" })).toBeTruthy();
    expect(screen.getByText("alex")).toBeTruthy();
    expect(screen.getByText("1:15")).toBeTruthy();
  });

  it("opens an item on click and on Enter, and marks the active one", async () => {
    const onOpen = vi.fn();
    render(<MediaGrid label="Photos" items={items} onOpen={onOpen} activeId="b" />);
    await userEvent.click(screen.getByRole("button", { name: "Beach" }));
    expect(onOpen).toHaveBeenLastCalledWith(items[0]);
    screen.getByRole("button", { name: "sam, video, 1:15" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenLastCalledWith(items[1]);
    expect(screen.getByRole("button", { name: "sam, video, 1:15" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: "Beach" }).getAttribute("aria-current")).toBeNull();
  });

  it("moves focus with the arrow keys, Home and End", async () => {
    render(<MediaGrid label="Photos" items={items} />);
    screen.getByRole("button", { name: "Beach" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "sam, video, 1:15" }));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Audio, audio, 0:09" }));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Beach" }));
  });

  it("loads images lazily and shows a quiet placeholder for one that fails", () => {
    const { container } = render(<MediaGrid label="Photos" items={items} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(3);
    expect(imgs[0]!.getAttribute("loading")).toBe("lazy");
    fireEvent.error(imgs[0]!);
    expect(container.querySelectorAll("img")).toHaveLength(2);
    fireEvent.load(container.querySelectorAll("img")[0]!);
    expect(container.querySelector("img")!.className).toContain("opacity-100");
  });

  it("asks for the next page with the button, shows the count, and waits while loading", async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<MediaGrid label="Photos" items={items} total={5000} hasMore onLoadMore={onLoadMore} autoLoad={false} />);
    expect(screen.getByText("3 of 5,000")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(<MediaGrid label="Photos" items={items} total={5000} hasMore loading onLoadMore={onLoadMore} autoLoad={false} />);
    expect(screen.getByRole("list", { name: "Photos" }).getAttribute("aria-busy")).toBe("true");
    expect((screen.getByRole("button", { name: "Load more" }) as HTMLButtonElement).getAttribute("aria-busy")).toBe("true");
    rerender(<MediaGrid label="Photos" items={items} />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("loads the next page by itself when the end scrolls into view", () => {
    const watchers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
          watchers.push(cb);
        }
        observe = observe;
        disconnect = vi.fn();
      },
    );
    const onLoadMore = vi.fn();
    render(<MediaGrid label="Photos" items={items} hasMore onLoadMore={onLoadMore} />);
    expect(observe).toHaveBeenCalled();
    watchers[0]!([{ isIntersecting: false }]);
    expect(onLoadMore).not.toHaveBeenCalled();
    watchers[0]!([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("draws the empty message only when there is nothing and nothing is coming", () => {
    const { rerender } = render(<MediaGrid label="Photos" items={[]} empty={<p>No photos yet.</p>} />);
    expect(screen.getByText("No photos yet.")).toBeTruthy();
    rerender(<MediaGrid label="Photos" items={[]} loading empty={<p>No photos yet.</p>} />);
    expect(screen.queryByText("No photos yet.")).toBeNull();
    expect(screen.getByRole("list", { name: "Photos" })).toBeTruthy();
  });
});
