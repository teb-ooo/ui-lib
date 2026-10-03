import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { isNavigableRoute } from "../../src/cmdk/builtins";
import { readPlayground } from "../../src/cmdk/playground-global";
import { renderApp } from "./harness";

const external = vi.hoisted(() => ({ assignLocation: vi.fn(), openInNewTab: vi.fn() }));
vi.mock("../../src/cmdk/external", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/cmdk/external")>();
  return { ...actual, ...external };
});

const dialog = () => screen.queryByRole("dialog");
const optionTitles = () => screen.queryAllByRole("option").map((o) => o.textContent ?? "");
const has = (title: string) => optionTitles().some((t) => t.includes(title));

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Control>}k{/Control}");
  await screen.findByRole("dialog");
}

describe("navigation", () => {
  it("lists a Go to entry per route without required params, titled from staticData or the path", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    const rows = screen.getAllByRole("option").filter((o) => o.textContent && ["Home", "Items", "/settings", "Assistant"].some((t) => o.textContent?.includes(t)));
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(has("Home")).toBe(true);
    expect(has("Items")).toBe(true);
    expect(has("/settings")).toBe(true); // no staticData.title: falls back to the path
    expect(has("Item detail")).toBe(false); // required param
    expect(screen.getByText("Go to")).toBeInTheDocument();
    // Routes whose first segment starts with "_" are private and never offered under "Go to".
    expect(has("Agent")).toBe(false);
  });

  it("navigates on Enter", async () => {
    const user = userEvent.setup();
    const { router } = await renderApp();
    await openPalette(user);
    await user.keyboard("items{Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/items"));
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("classifies routes", () => {
    expect(isNavigableRoute("/items")).toBe(true);
    expect(isNavigableRoute("/")).toBe(true);
    expect(isNavigableRoute("/items/$id")).toBe(false);
    expect(isNavigableRoute("/files/$")).toBe(false);
    expect(isNavigableRoute("/posts/{-$page}")).toBe(true);
    expect(isNavigableRoute("/_agent")).toBe(false);
  });
});

describe("theme", () => {
  it("has no Toggle theme command and never touches data-theme or storage", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    expect(has("Toggle theme")).toBe(false);
    await user.keyboard("theme");
    expect(has("Toggle theme")).toBe(false);
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(window.localStorage.getItem("playground-theme")).toBeNull();
  });
});

describe("environment-dependent entries", () => {
  it("Open in Claude app appears only when the URL is set, accepting snake_case and camelCase", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    expect(has("Open in Claude app")).toBe(false);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    (window as unknown as { __PLAYGROUND__: unknown }).__PLAYGROUND__ = { claudeSessionUrl: "https://claude.ai/code/session_1" };
    await openPalette(user);
    await user.keyboard("claude app{Enter}");
    expect(external.openInNewTab).toHaveBeenCalledWith("https://claude.ai/code/session_1");
  });

  it("Open in Claude app with snake_case key", async () => {
    const user = userEvent.setup();
    await renderApp({ playground: { claude_session_url: "https://claude.ai/code/session_2" } });
    await openPalette(user);
    expect(has("Open in Claude app")).toBe(true);
  });

  it("has no Sign out or Profile of its own: the Shell registers them as platform commands", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    expect(has("Sign out")).toBe(false);
    expect(has("Profile")).toBe(false);
  });
});


describe("readPlayground", () => {
  it("is safe when absent or malformed and accepts both key styles", () => {
    expect(readPlayground()).toEqual({ appName: "", env: "", claudeSessionUrl: "" });
    (window as unknown as { __PLAYGROUND__: unknown }).__PLAYGROUND__ = null;
    expect(readPlayground().appName).toBe("");
    (window as unknown as { __PLAYGROUND__: unknown }).__PLAYGROUND__ = { app_name: "a", env: 3 };
    expect(readPlayground()).toMatchObject({ appName: "a", env: "" });
    (window as unknown as { __PLAYGROUND__: unknown }).__PLAYGROUND__ = { appName: "b" };
    expect(readPlayground()).toMatchObject({ appName: "b" });
  });
});
