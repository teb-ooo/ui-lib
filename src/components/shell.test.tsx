import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useLive } from "@teb-ooo/web";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandProvider } from "../cmdk";
import { PlatformBar } from "./platform-bar";
import { FEEDBACK_SHORTCUT, navigation, platformCommands } from "./platform-commands";
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
  it("reverses the current page, and only that item", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByRole("link", { name: "Home" }).className.split(" ")).toContain("reversed");
    expect(screen.getByRole("link", { name: /Tasks/ }).className.split(" ")).not.toContain("reversed");
  });
  it("width fit sizes to the content between 10rem and 16rem; wide is a fixed 16rem; icons only stays 3rem", () => {
    const cls = (c: HTMLElement) => (c.firstElementChild as HTMLElement).className;
    const fit = render(<Sidebar items={items} width="fit" />);
    expect(cls(fit.container)).toContain("w-fit");
    expect(cls(fit.container)).toContain("min-w-40");
    fit.unmount();
    expect(cls(render(<Sidebar items={items} />).container)).toContain("w-64");
    const icons = render(<Sidebar items={items} width="fit" collapsed />);
    expect(cls(icons.container)).toContain("w-12");
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

  it("has an agent icon that opens the app's session, only when the app has one", async () => {
    const { unmount } = mount(member, { claude_session_url: "https://claude.ai/code/session_x" });
    const link = await screen.findByRole("link", { name: "Open the agent" });
    expect(link.getAttribute("href")).toBe("https://claude.ai/code/session_x");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    unmount();
    mount(member, { claude_session_url: "" });
    expect(screen.queryByRole("link", { name: "Open the agent" })).toBeNull();
  });

  it("signed out the bar shows neither the agent link nor the search icon, only Sign in", async () => {
    mount(null, { claude_session_url: "https://claude.ai/code/session_x" });
    await waitFor(() => expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy());
    expect(screen.queryByRole("link", { name: /agent/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open command palette" })).toBeNull();
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
    expect(go).toHaveBeenCalledWith("https://bd-staging.example.test/");
    go.mockRestore();
  });

  it("signed out: Sign in in the bar, no Sign out command", async () => {
    mount(null);
    await waitFor(() => expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy());
    // The search icon is not drawn signed out; the keyboard still opens the palette.
    await userEvent.keyboard("{Control>}k{/Control}");
    const palette = await screen.findByRole("dialog");
    expect(within(palette).queryByText("Sign out")).toBeNull();
    expect(within(palette).getByText("Go to dashboard")).toBeTruthy();
  });

  it("the person menu has My profile and Sign out", async () => {
    mount(member);
    await userEvent.click(await screen.findByRole("button", { name: "Account" }));
    expect(await screen.findByRole("menuitem", { name: "My profile" })).toHaveProperty("href", "https://id-staging.example.test/profile");
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

  it("without a sidebar there is no column, no menu icon and no drawer, at any width", async () => {
    for (const width of [1024, 390]) {
      setViewportWidth(width);
      window.__PLAYGROUND__ = { app_name: "tracker" } as never;
      vi.stubGlobal("fetch", vi.fn(async (input: unknown) => (String(input).includes("/auth/me") ? Response.json(member) : new Response("", { status: 404 }))));
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
      expect(await screen.findByRole("button", { name: "Open command palette" })).toBeTruthy();
      unmount();
    }
    setViewportWidth(1024);
  });

  it("works without a CommandProvider: the trigger is inert", async () => {
    window.__PLAYGROUND__ = { app_name: "tracker" } as never;
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => (String(input).includes("/auth/me") ? Response.json(member) : new Response("", { status: 404 }))));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Shell sidebar={null}>x</Shell>
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open command palette" }));
  });
});

describe("agent status dot and bubble", () => {
  const base = { appName: "a", live: null, user: { name: "a" }, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
  it.each([
    ["working", "is working"],
    ["idle", "is idle"],
    ["offline", "is offline"],
    ["logged_out", "is signed out"],
  ] as const)("%s: a dot on the agent link named by the status, which opens the session", (status, text) => {
    render(<PlatformBar {...base} agentHref="https://claude.ai/code/s" agentStatus={status} />);
    const link = screen.getByRole("link", { name: `Agent ${text}` });
    expect(link.getAttribute("data-agent-status")).toBe(status);
    expect(link.getAttribute("href")).toBe("https://claude.ai/code/s");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.querySelector(`[data-dot="${status}"]`)).not.toBeNull();
  });

  it("without a status it is a plain link to the session with no dot, and nothing without either", () => {
    const { rerender } = render(<PlatformBar {...base} agentHref="https://claude.ai/code/s" agentStatus={null} />);
    const link = screen.getByRole("link", { name: "Open the agent" });
    expect(link.querySelector("[data-dot]")).toBeNull();
    rerender(<PlatformBar {...base} />);
    expect(screen.queryByRole("link", { name: /agent/i })).toBeNull();
    expect(screen.queryByRole("img", { name: /Agent/ })).toBeNull();
  });

  it("while it works a bubble beside the icon shows the action and the turn timer, with no click needed", async () => {
    const open = vi.fn();
    render(
      <PlatformBar
        {...base}
        agentHref="https://claude.ai/code/s"
        agentStatus="working"
        onAgentOpenChange={open}
        agentDetails={{ action: { label: "Running a command", target: "" }, turnStartedAt: "2026-10-03T01:00:00Z", serverTime: Date.parse("2026-10-03T01:24:23Z"), receivedAt: Date.now() }}
      />,
    );
    const bubble = screen.getByRole("status", { name: "Agent progress" });
    expect(within(bubble).getByText("Running a command")).toBeTruthy();
    expect(within(bubble).getByText(/^24m2[3-9]s$/)).toBeTruthy();
    expect(open).toHaveBeenLastCalledWith(true);
  });

  it("says Thinking with no action, has no timer on an older platform, and goes away when the agent stops", async () => {
    const open = vi.fn();
    const { rerender } = render(<PlatformBar {...base} agentStatus="working" onAgentOpenChange={open} agentDetails={{ action: null }} />);
    const bubble = screen.getByRole("status", { name: "Agent progress" });
    expect(within(bubble).getByText("Thinking")).toBeTruthy();
    expect(bubble.querySelector(".tabular-nums")).toBeNull();
    rerender(<PlatformBar {...base} agentStatus="idle" onAgentOpenChange={open} agentDetails={{ action: null }} />);
    await waitFor(() => expect(screen.queryByRole("status", { name: "Agent progress" })).toBeNull());
    expect(open).toHaveBeenLastCalledWith(false);
  });

  it("with a status but no session the icon is not a link", () => {
    render(<PlatformBar {...base} agentStatus="idle" />);
    expect(screen.queryByRole("link", { name: /agent/i })).toBeNull();
    expect(screen.getByRole("img", { name: "Agent is idle" })).toBeTruthy();
  });
});

describe("platform bar icon order", () => {
  it("the agent icon is the leftmost of the icons, before search, feedback and the person menu", () => {
    render(
      <PlatformBar
        appName="a"
        live={null}
        user={{ name: "alex", email: "a@b.c" }}
        signOutHref="/o"
        signInHref="/i"
        onOpenPalette={() => undefined}
        onFeedback={() => undefined}
        agentHref="https://claude.ai/code/s"
        agentStatus="working"
      />,
    );
    const names = [...screen.getByRole("banner").querySelectorAll("button, a")].map((e) => e.getAttribute("aria-label"));
    expect(names).toEqual(["Agent is working", "Open command palette", "Send feedback", "Account"]);
  });
});

describe("PlatformBar", () => {
  const base = { appName: "a", user: { name: "a" }, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
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
    const props = { appName: "a", live: "live" as const, user: { name: "a" }, signOutHref: "/o", signInHref: "/i", onOpenPalette: () => undefined };
    const { rerender } = render(<PlatformBar {...props} />);
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send feedback" })).toBeNull();
    rerender(<PlatformBar {...props} onOpenMenu={() => undefined} onFeedback={() => undefined} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeTruthy();
  });
});

describe("Send feedback hotkey", () => {
  it("is Cmd or Ctrl+I (no Shift), on the command and on the bar icon's tooltip, only for the owner", async () => {
    const open = vi.fn();
    const cmds = platformCommands({ signedIn: true, feedback: { available: true, open } });
    const send = cmds.find((c) => c.id === "send-feedback");
    expect(send?.shortcut).toBe("mod+i");
    expect(FEEDBACK_SHORTCUT).toBe("mod+i");
    const when = send?.when;
    expect(typeof when === "function" ? when() : when).toBe(true);
    const other = platformCommands({ signedIn: true, feedback: { available: false, open } }).find((c) => c.id === "send-feedback");
    expect(typeof other?.when === "function" ? other.when() : other?.when).toBe(false);
    render(<PlatformBar appName="a" live={null} user={{ name: "o" }} signOutHref="/o" signInHref="/i" onOpenPalette={() => undefined} onFeedback={open} />);
    await userEvent.hover(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByRole("group", { name: /^(Control|Command) I$/ })).toBeTruthy();
  });
});

describe("Switch to staging / production", () => {
  it("swaps the environment in the address and keeps the path, query and hash", async () => {
    const { otherEnvironment } = await import("./platform-commands");
    expect(otherEnvironment("https://notes.teb.ooo/notes/3?tab=a#x", "production")).toEqual({ to: "staging", url: "https://notes-staging.teb.ooo/notes/3?tab=a#x" });
    expect(otherEnvironment("https://notes-staging.teb.ooo/notes/3", "staging")).toEqual({ to: "production", url: "https://notes.teb.ooo/notes/3" });
    expect(otherEnvironment("http://localhost:8080/x", "dev")).toBeNull();
    expect(otherEnvironment("https://notes.teb.ooo/", "staging")).toBeNull();
  });
  it("is a platform command for the owner only, and only on a staging or production address", async () => {
    const { platformCommands } = await import("./platform-commands");
    const find = (available: boolean) => platformCommands({ signedIn: true, feedback: { available, open: () => undefined } }).find((c) => c.id === "platform:switch-environment");
    expect(find(true)?.keywords).toContain("prod");
    const when = (c: ReturnType<typeof find>) => (typeof c?.when === "function" ? c.when() : c?.when);
    expect(when(find(false))).toBe(false); // not the owner
    expect(when(find(true))).toBe(false); // the test page is neither staging nor production
  });
});
