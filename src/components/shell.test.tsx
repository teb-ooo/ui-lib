import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useLive } from "@teb-ooo/web";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandProvider } from "../cmdk";
import { PlatformBar } from "./platform-bar";
import { navigation } from "./platform-commands";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { Shell } from "./shell";
import { Sidebar } from "./sidebar";

const items = [
  { id: "a", label: "Home", href: "/", active: true },
  { id: "b", label: "Tasks", href: "/tasks", badge: 3 },
];

describe("Sidebar", () => {
  it("marks the current page and shows badges", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Tasks/ }).textContent).toContain("3");
  });
  it("collapsed: labels stay available to assistive technology only, and the toggle reports the change", () => {
    let next: boolean | null = null;
    render(<Sidebar items={items} collapsed onCollapsedChange={(c) => (next = c)} />);
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(next).toBe(false);
  });
  it("draws links through renderLink", () => {
    render(<Sidebar items={items} renderLink={(item, content, props) => <span data-testid={item.id} className={props.className}>{content}</span>} />);
    expect(screen.getByTestId("b").textContent).toContain("Tasks");
  });
});

const owner = { subject: "1", email: "alex@example.test", username: "alex", groups: [], is_admin: false, is_owner: true };
const member = { ...owner, email: "sam@example.test", username: "sam", is_owner: false };

function mount(me: object | null, global: Record<string, unknown> = {}, extra: ReactNode = null) {
  window.__PLAYGROUND__ = { app_name: "tracker", env: "staging", platform_domain: "example.test", ...global } as never;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes("/auth/me")) return me ? Response.json(me) : new Response("", { status: 401 });
      return new Response("{}", { status: 404 });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CommandProvider standalone>
        <Shell sidebar={<Sidebar items={items} />}>
          <p>Content</p>
          {extra}
        </Shell>
      </CommandProvider>
    </QueryClientProvider>,
  );
}

async function openPalette() {
  await userEvent.click(screen.getByRole("button", { name: "Open command palette" }));
  return await screen.findByRole("dialog");
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { __PLAYGROUND__?: unknown }).__PLAYGROUND__;
});

describe("Shell", () => {
  it("on a wide screen shows the sidebar as a column with no menu button", () => {
    mount(null);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
  });

  it("has an agent icon that opens the app's session, only when the app has one", () => {
    const { unmount } = mount(null, { claude_session_url: "https://claude.ai/code/session_x" });
    const link = screen.getByRole("link", { name: "Open the agent" });
    expect(link.getAttribute("href")).toBe("https://claude.ai/code/session_x");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    unmount();
    mount(null, { claude_session_url: "" });
    expect(screen.queryByRole("link", { name: "Open the agent" })).toBeNull();
  });

  it("takes no header prop and no slot", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        {/* @ts-expect-error the interface is closed: there is no header prop */}
        <Shell sidebar={null} header="Title">
          <p>Content</p>
        </Shell>
      </QueryClientProvider>,
    );
  });

  it("the bar is one 36px line whose only text is the app name", async () => {
    mount(owner);
    const bar = screen.getByRole("banner");
    expect(bar.className).toContain("h-9");
    expect(bar.textContent).toBe("tracker");
    expect(bar.querySelectorAll("header")).toHaveLength(0);
    await waitFor(() => expect(within(bar).getByRole("button", { name: "Account" })).toBeTruthy());
    expect(bar.textContent).toBe("tracker");
    for (const el of bar.querySelectorAll("button, a")) expect(el.getAttribute("aria-label")).toBeTruthy();
  });

  it("shows the live dot only when live updates are not connected, and the environment mark on staging only", () => {
    const { unmount } = mount(null);
    // No screen has a live stream, so there is no dot at all.
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    function Streaming() {
      useLive({ enabled: false });
      return null;
    }
    // `off` is not a fault either: still no dot.
    const second = mount(null, {}, <Streaming />);
    expect(screen.queryByRole("status")).toBeNull();
    const mark = screen.getByRole("img", { name: "Staging" });
    expect(mark.className).toContain("h-2");
    expect(mark.className).toContain("w-12");
    expect(mark.textContent).toBe("");
    second.unmount();
    mount(null, { env: "production" });
    expect(screen.queryByRole("img", { name: "Staging" })).toBeNull();
  });

  it("offers Send feedback in the bar and the palette to the owner only", async () => {
    const { unmount } = mount(owner);
    await waitFor(() => expect(screen.getByRole("button", { name: "Send feedback" })).toBeTruthy());
    const palette = await openPalette();
    expect(within(palette).getByText("Send feedback")).toBeTruthy();
    unmount();
    mount(member);
    await waitFor(() => expect(screen.getByRole("button", { name: "Account" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Send feedback" })).toBeNull();
    const second = await openPalette();
    expect(within(second).queryByText("Send feedback")).toBeNull();
  });

  it("registers the platform commands under their own group, and Sign out goes to /auth/logout", async () => {
    const go = vi.spyOn(navigation, "go").mockImplementation(() => undefined);
    mount(owner);
    await waitFor(() => expect(screen.getByRole("button", { name: "Account" })).toBeTruthy());
    const palette = await openPalette();
    await waitFor(() => expect(within(palette).getByText("Platform")).toBeTruthy());
    for (const t of ["Sign out", "My profile", "Go to dashboard", "Go to work tracker", "Go to design system"]) {
      expect(within(palette).getByText(t)).toBeTruthy();
    }
    await userEvent.click(within(palette).getByText("Go to work tracker"));
    expect(go).toHaveBeenCalledWith("https://bd.example.test/");
    go.mockRestore();
  });

  it("signed out: Sign in in the bar, no Sign out command", async () => {
    mount(null);
    await waitFor(() => expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy());
    const palette = await openPalette();
    expect(within(palette).queryByText("Sign out")).toBeNull();
    expect(within(palette).getByText("Go to dashboard")).toBeTruthy();
  });

  it("the person menu has My profile and Sign out", async () => {
    mount(member);
    await userEvent.click(await screen.findByRole("button", { name: "Account" }));
    expect(await screen.findByRole("menuitem", { name: "My profile" })).toHaveProperty("href", "https://id.example.test/profile");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toHaveProperty("href", expect.stringContaining("/auth/logout"));
  });

  it("on a phone the bar carries the menu icon that opens the sidebar as a drawer", () => {
    setViewportWidth(390);
    mount(null);
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByRole("banner").textContent).toBe("tracker");
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Expand sidebar" })).toBeNull();
  });

  it("without a sidebar there is no column, no menu icon and no drawer, at any width", () => {
    for (const width of [1024, 390]) {
      setViewportWidth(width);
      window.__PLAYGROUND__ = { app_name: "tracker" } as never;
      vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 401 })));
      const { container, unmount } = render(
        <QueryClientProvider client={new QueryClient()}>
          <Shell>
            <p>Content</p>
          </Shell>
        </QueryClientProvider>,
      );
      expect(container.querySelector("aside")).toBeNull();
      expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
      expect(screen.getByText("Content")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Open command palette" })).toBeTruthy();
      unmount();
    }
    setViewportWidth(1024);
  });

  it("works without a CommandProvider: the trigger is inert", () => {
    window.__PLAYGROUND__ = { app_name: "tracker" } as never;
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 401 })));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Shell sidebar={null}>x</Shell>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open command palette" }));
  });
});

describe("agent status dot", () => {
  const base = { appName: "a", live: null, user: null, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
  it.each([
    ["working", "is working"],
    ["idle", "is idle"],
    ["offline", "is offline"],
    ["logged_out", "is signed out"],
  ] as const)("%s: a dot on the agent link that is named by the status", (status, text) => {
    render(<PlatformBar {...base} agentHref="https://claude.ai/code/s" agentStatus={status} />);
    const link = screen.getByRole("link", { name: `Open the agent, ${text}` });
    expect(link.getAttribute("data-agent-status")).toBe(status);
    expect(link.querySelector(`[data-dot="${status}"]`)).not.toBeNull();
  });
  it("draws no dot without a status, and shows a status-only icon without a session link", () => {
    const { rerender } = render(<PlatformBar {...base} agentHref="https://claude.ai/code/s" agentStatus={null} />);
    expect(screen.getByRole("link", { name: "Open the agent" }).querySelector("[data-dot]")).toBeNull();
    rerender(<PlatformBar {...base} agentStatus="working" />);
    expect(screen.queryByRole("link", { name: /Open the agent/ })).toBeNull();
    expect(screen.getByRole("img", { name: "Agent is working" })).toBeTruthy();
    rerender(<PlatformBar {...base} />);
    expect(screen.queryByRole("img", { name: /Agent/ })).toBeNull();
  });
});

describe("PlatformBar", () => {
  const base = { appName: "a", user: null, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
  it.each([
    ["live", false],
    ["off", false],
    [null, false],
    ["reconnecting", true],
    ["degraded", true],
  ] as const)("live=%s shows the dot: %s, and it sits before the Cmd+K icon (left side)", (live, shown) => {
    render(<PlatformBar {...base} live={live} />);
    const dot = screen.queryByRole("status");
    expect(dot !== null).toBe(shown);
    if (dot) {
      const bar = screen.getByRole("banner");
      const items = [...bar.children];
      expect(items.indexOf(dot)).toBeLessThan(items.indexOf(screen.getByRole("button", { name: "Open command palette" })));
      expect(items.indexOf(dot)).toBe(1); // right after the app name
    }
  });

  it("shows the menu icon only when asked and the feedback icon only when given a handler", () => {
    const props = { appName: "a", live: "live" as const, user: null, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
    const { rerender } = render(<PlatformBar {...props} />);
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send feedback" })).toBeNull();
    rerender(<PlatformBar {...props} onOpenMenu={() => undefined} onFeedback={() => undefined} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeTruthy();
  });
});
