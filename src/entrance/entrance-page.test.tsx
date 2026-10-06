import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntrancePage } from "./entrance-page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EntrancePage", () => {
  it("has its heading for assistive technology, which is not drawn, and the app's own content", () => {
    render(
      <EntrancePage title="Sign in">
        <button type="button">Enter</button>
        <p>The sign-in took too long.</p>
      </EntrancePage>,
    );
    const heading = screen.getByRole("heading", { name: "Sign in" });
    expect(heading.className).toContain("sr-only");
    expect(screen.getByRole("button", { name: "Enter" })).toBeTruthy();
    expect(screen.getByText("The sign-in took too long.")).toBeTruthy();
  });

  it("draws nothing and breaks nothing where there is no WebGL (the button still works)", async () => {
    // A browser that can draw: matchMedia exists, but the WebGL context cannot be made (jsdom has none).
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const { container } = render(
      <EntrancePage title="Sign in" busy>
        <button type="button">Enter</button>
      </EntrancePage>,
    );
    // The scene's chunk loads after the page; give it the chance to try and fail quietly.
    await waitFor(() => expect(container.querySelector("[aria-hidden='true']")).toBeTruthy());
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByRole("button", { name: "Enter" })).toBeTruthy();
  });

  it("takes the box's classes from sceneClassName, 96px by default", () => {
    const { container, rerender } = render(<EntrancePage title="T">x</EntrancePage>);
    expect(container.querySelector(".size-24")).toBeTruthy();
    rerender(
      <EntrancePage title="T" sceneClassName="size-40">
        x
      </EntrancePage>,
    );
    expect(container.querySelector(".size-40")).toBeTruthy();
    expect(container.querySelector(".size-24")).toBeNull();
  });
});
