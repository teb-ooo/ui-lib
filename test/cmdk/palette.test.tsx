import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCommandPalette, useRegisterCommands } from "../../src/cmdk/index";
import type { Command } from "../../src/cmdk/index";
import { renderApp, renderBare } from "./harness";
import { setViewportWidth } from "./viewport";

const dialog = () => screen.queryByRole("dialog");
const combobox = () => screen.getByRole("combobox", { name: "Search commands" });
const optionTitles = () => screen.queryAllByRole("option").map((o) => o.textContent ?? "");

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard("{Control>}k{/Control}");
  await screen.findByRole("dialog");
}

function Registrar({ commands, deps }: { commands: Command[]; deps?: unknown[] }) {
  useRegisterCommands(commands, deps);
  return null;
}

describe("open and close", () => {
  it("Ctrl+K opens and toggles closed; Esc closes", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(dialog()).toBeNull();
    await user.keyboard("{Control>}k{/Control}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(dialog()).toBeNull());
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("opens on Cmd+K when the platform is macOS", async () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
    const user = userEvent.setup();
    await renderApp();
    await user.keyboard("{Control>}k{/Control}");
    expect(dialog()).toBeNull();
    await user.keyboard("{Meta>}k{/Meta}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("`/` opens it when no field has focus, and types normally in a field", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByLabelText("page field"));
    await user.keyboard("/");
    expect(dialog()).toBeNull();
    expect(screen.getByLabelText("page field")).toHaveValue("/");
    await user.click(document.body);
    await user.keyboard("/");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    // The slash opened the palette and was not typed into the search box.
    expect(combobox()).toHaveValue("");
  });

  it("focus moves to the search input and returns to the trigger on close", async () => {
    const user = userEvent.setup();
    await renderApp();
    const trigger = screen.getByRole("button", { name: "Open command palette" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await waitFor(() => expect(combobox()).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("useCommandPalette exposes open, close and isOpen", async () => {
    const user = userEvent.setup();
    function Controls() {
      const { open, close, isOpen } = useCommandPalette();
      return (
        <>
          <button onClick={open}>do-open</button>
          <button onClick={close}>do-close</button>
          <span data-testid="state">{String(isOpen)}</span>
        </>
      );
    }
    renderBare(<Controls />);
    await user.click(screen.getByText("do-open"));
    await screen.findByRole("dialog");
    expect(screen.getByTestId("state")).toHaveTextContent("true");
    act(() => screen.getByText("do-close").click());
    await waitFor(() => expect(dialog()).toBeNull());
    expect(screen.getByTestId("state")).toHaveTextContent("false");
  });
});

describe("accessibility", () => {
  it("has combobox and listbox roles with aria-activedescendant following the arrows", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("One"), cmd("Two"), cmd("Three")]} /> });
    await openPalette(user);
    const input = combobox();
    expect(input).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
    const opts = screen.getAllByRole("option");
    expect(opts[0]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", opts[0]?.id);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[1]?.id);
    await user.keyboard("{End}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[opts.length - 1]?.id);
    await user.keyboard("{Home}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[0]?.id);
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", opts[opts.length - 1]?.id);
  });
});

const cmd = (title: string, extra: Partial<Command> = {}): Command => ({
  id: extra.id ?? title.toLowerCase().replace(/\s+/gu, "-"),
  title,
  group: "Test",
  run: () => undefined,
  ...extra,
});

describe("registration", () => {
  it("registers while mounted and unregisters on unmount", async () => {
    const user = userEvent.setup();
    function Toggle() {
      const [on, setOn] = useState(true);
      return (
        <>
          <button onClick={() => setOn(false)}>unmount</button>
          {on ? <Registrar commands={[cmd("Export CSV")]} /> : null}
        </>
      );
    }
    await renderApp({ extra: <Toggle /> });
    await openPalette(user);
    expect(optionTitles().some((t) => t.includes("Export CSV"))).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await user.click(screen.getByText("unmount"));
    await openPalette(user);
    expect(optionTitles().some((t) => t.includes("Export CSV"))).toBe(false);
  });

  it("commands of a route vanish on navigation", async () => {
    const user = userEvent.setup();
    const { router } = await renderApp({
      routes: [
        { path: "/", title: "Home", component: () => <Registrar commands={[cmd("Home action")]} /> },
        { path: "/other", title: "Other" },
      ],
    });
    await openPalette(user);
    expect(optionTitles().some((t) => t.includes("Home action"))).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    await act(() => router.navigate({ to: "/other" }));
    await openPalette(user);
    expect(optionTitles().some((t) => t.includes("Home action"))).toBe(false);
  });

  it("uses the latest run closure and re-reads the list when deps change", async () => {
    const user = userEvent.setup();
    const seen: number[] = [];
    function Counter() {
      const [n, setN] = useState(0);
      useRegisterCommands([{ id: "show", title: `Count is ${n}`, group: "Test", run: () => void seen.push(n) }], [n]);
      return <button onClick={() => setN((x) => x + 1)}>inc</button>;
    }
    await renderApp({ extra: <Counter /> });
    await user.click(screen.getByText("inc"));
    await user.click(screen.getByText("inc"));
    await openPalette(user);
    await user.keyboard("count");
    expect(optionTitles()[0]).toContain("Count is 2");
    await user.keyboard("{Enter}");
    expect(seen).toEqual([2]);
  });
});

describe("search and view", () => {
  it("filters, highlights matched characters and groups results", async () => {
    const user = userEvent.setup();
    await renderApp({
      extra: <Registrar commands={[cmd("New item", { group: "Items" }), cmd("Delete item", { group: "Items" }), cmd("Renew plan", { group: "Billing" })]} />,
    });
    await openPalette(user);
    await user.keyboard("nwi");
    const opts = screen.getAllByRole("option");
    expect(opts[0]).toHaveTextContent("New item");
    const marks = opts[0]?.querySelectorAll("[data-match]");
    expect([...(marks ?? [])].map((m) => m.textContent).join("")).toBe("Nwi");
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.queryByText("Billing")).toBeNull();
  });

  it("matches keywords", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Export", { keywords: ["csv", "download"] })]} /> });
    await openPalette(user);
    await user.keyboard("downl");
    expect(optionTitles()).toEqual(["Export"]);
  });

  it("filters with `when`, evaluated at render time", async () => {
    const user = userEvent.setup();
    let allowed = false;
    await renderApp({ extra: <Registrar commands={[cmd("Secret", { when: () => allowed }), cmd("Hidden", { when: false }), cmd("Shown", { when: true })]} /> });
    await openPalette(user);
    expect(optionTitles().some((t) => t.includes("Secret"))).toBe(false);
    expect(optionTitles().some((t) => t.includes("Hidden"))).toBe(false);
    expect(optionTitles().some((t) => t.includes("Shown"))).toBe(true);
    allowed = true;
    await user.keyboard("sec");
    expect(optionTitles()[0]).toContain("Secret");
  });

  it("shows No results and nothing else for a miss", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    await user.keyboard("zzzzqq");
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});

describe("running", () => {
  it("runs the active command with the keyboard only, then closes", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("Archive", { run })]} /> });
    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog");
    await user.keyboard("arch{Enter}");
    expect(run).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("shows a spinner while an async run is pending, then closes", async () => {
    const user = userEvent.setup();
    let resolve: () => void = () => undefined;
    const run = () => new Promise<void>((r) => (resolve = r));
    await renderApp({ extra: <Registrar commands={[cmd("Sync", { run })]} /> });
    await openPalette(user);
    await user.keyboard("sync{Enter}");
    expect(await screen.findByRole("img", { name: "Running" })).toBeInTheDocument();
    expect(dialog()).not.toBeNull();
    await act(async () => resolve());
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("reports an async failure in an inline error row and stays open", async () => {
    const user = userEvent.setup();
    const run = () => Promise.reject({ detail: "Server said no" });
    await renderApp({ extra: <Registrar commands={[cmd("Publish", { run })]} /> });
    await openPalette(user);
    await user.keyboard("publish{Enter}");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Publish failed: Server said no");
    expect(dialog()).not.toBeNull();
    expect(screen.queryByRole("img", { name: "Running" })).toBeNull();
    // Typing clears the error.
    await user.keyboard("x");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("never shows a thrown Error's own message, only describeError's sentence", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Leak", { run: () => Promise.reject(new Error("pg: connection refused")) })]} /> });
    await openPalette(user);
    await user.keyboard("leak{Enter}");
    expect(await screen.findByRole("alert")).not.toHaveTextContent("pg:");
  });

  it("reports a synchronous throw the same way", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Boom", { run: () => { throw new Error("sync fail"); } })]} /> });
    await openPalette(user);
    await user.keyboard("boom{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Boom failed: Something went wrong. Try again.");
  });

  it("runs on click", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("Clicky", { run })]} /> });
    await openPalette(user);
    await user.click(screen.getByRole("option", { name: /Clicky/u }));
    expect(run).toHaveBeenCalled();
  });
});

describe("nested views", () => {
  const targets = (log: string[]): Command[] => [cmd("Inbox", { run: () => void log.push("inbox") }), cmd("Archive", { run: () => void log.push("archive") })];

  it("opens `children` with a breadcrumb; Backspace on an empty query goes back", async () => {
    const user = userEvent.setup();
    const log: string[] = [];
    await renderApp({ extra: <Registrar commands={[cmd("Move to...", { children: targets(log) })]} /> });
    await openPalette(user);
    await user.keyboard("move{Enter}");
    const crumbs = await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(crumbs).toHaveTextContent("Commands");
    expect(within(crumbs).getByText("Move to...")).toHaveAttribute("aria-current", "page");
    expect(optionTitles()).toEqual(["Inbox", "Archive"]);
    // A non-empty query: Backspace edits it instead of going back.
    await user.keyboard("in{Backspace}");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    await user.keyboard("{Backspace}{Backspace}");
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
    expect(optionTitles().some((t) => t.includes("Move to..."))).toBe(true);
  });

  it("opens a view when run returns a list, and running a leaf records and closes", async () => {
    const user = userEvent.setup();
    const log: string[] = [];
    await renderApp({ extra: <Registrar commands={[cmd("Pick target", { run: () => Promise.resolve(targets(log)) })]} /> });
    await openPalette(user);
    await user.keyboard("pick{Enter}");
    await screen.findByRole("navigation", { name: "Breadcrumb" });
    await user.keyboard("arch{Enter}");
    expect(log).toEqual(["archive"]);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("the breadcrumb root button goes back", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Move to...", { children: [cmd("Inbox")] })]} /> });
    await openPalette(user);
    await user.keyboard("move{Enter}");
    await user.click(await screen.findByRole("button", { name: "Commands" }));
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });
});

describe("onHighlight of a nested view", () => {
  it("hears the highlighted command as the arrows move, the first one on open, and null when the view is left", async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    const onHighlight = (c: Command | null) => void seen.push(c ? c.title : null);
    await renderApp({ extra: <Registrar commands={[cmd("Preset...", { onHighlight, children: [cmd("Warm"), cmd("Cool"), cmd("Mono")] })]} /> });
    await openPalette(user);
    await user.keyboard("preset{Enter}");
    await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(seen.at(-1)).toBe("Warm");
    await user.keyboard("{ArrowDown}");
    expect(seen.at(-1)).toBe("Cool");
    await user.keyboard("{ArrowDown}{ArrowUp}");
    expect(seen.at(-1)).toBe("Cool");
    // pointer: moving over an option highlights it
    await user.hover(screen.getByRole("option", { name: /Mono/u }));
    expect(seen.at(-1)).toBe("Mono");
    // leaving the view (Backspace on an empty query) reports null
    await user.keyboard("{Backspace}");
    await waitFor(() => expect(seen.at(-1)).toBeNull());
    // the root list is not reported to it
    const count = seen.length;
    await user.keyboard("{ArrowDown}");
    expect(seen).toHaveLength(count);
  });

  it("reports null when the palette closes, and also works for a run that returns a list", async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    const onHighlight = (c: Command | null) => void seen.push(c ? c.title : null);
    await renderApp({ extra: <Registrar commands={[cmd("Pick...", { onHighlight, run: () => Promise.resolve([cmd("One"), cmd("Two")]) })]} /> });
    await openPalette(user);
    await user.keyboard("pick{Enter}");
    await screen.findByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(seen.at(-1)).toBe("One"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).toBeNull());
    expect(seen.at(-1)).toBeNull();
  });
});

describe("recents", () => {
  const key = "playground-command:recents:hello";
  const playground = { app_name: "hello" };

  it("stores the last commands run per app and shows them first on an empty query", async () => {
    const user = userEvent.setup();
    await renderApp({ playground, extra: <Registrar commands={[cmd("Alpha"), cmd("Beta"), cmd("Gamma")]} /> });
    await openPalette(user);
    await user.keyboard("gamma{Enter}");
    await waitFor(() => expect(dialog()).toBeNull());
    expect(JSON.parse(window.localStorage.getItem(key) ?? "[]")).toEqual(["gamma"]);
    await openPalette(user);
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("group")[0]).toHaveTextContent("Recent");
    expect(optionTitles()[0]).toContain("Gamma");
    // Not repeated under its own group.
    expect(optionTitles().filter((t) => t.includes("Gamma"))).toHaveLength(1);
  });

  it("keeps eight, most recent first, without duplicates", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 10 }, (_, i) => cmd(`Cmd${String.fromCharCode(97 + i)}`, { id: `c${i}` }));
    await renderApp({ playground, extra: <Registrar commands={many} /> });
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 3]) {
      await openPalette(user);
      await user.keyboard(`cmd${String.fromCharCode(97 + i)}{Enter}`);
      await waitFor(() => expect(dialog()).toBeNull());
    }
    const stored: string[] = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    expect(stored).toHaveLength(8);
    expect(stored[0]).toBe("c3");
    expect(new Set(stored).size).toBe(8);
  });

  it("does not show recents while typing", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(key, JSON.stringify(["alpha"]));
    await renderApp({ playground, extra: <Registrar commands={[cmd("Alpha")]} /> });
    await openPalette(user);
    expect(screen.getByText("Recent")).toBeInTheDocument();
    await user.keyboard("alp");
    expect(screen.queryByText("Recent")).toBeNull();
  });
});

describe("shortcuts", () => {
  it("runs a registered command's chord globally and shows it as Kbd in its row", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("New thing", { shortcut: "mod+shift+n", run })]} /> });
    await user.keyboard("{Control>}{Shift>}n{/Shift}{/Control}");
    expect(run).toHaveBeenCalledTimes(1);
    await openPalette(user);
    const row = screen.getByRole("option", { name: /New thing/u });
    expect(row.querySelector("[data-shortcut='mod+shift+n']")).not.toBeNull();
  });

  it("runs a sequence `g i` and stops after unmount", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("Items", { shortcut: "g i", run })]} /> });
    await user.keyboard("gi");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("stops firing once the registering component unmounts", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    function Toggle() {
      const [on, setOn] = useState(true);
      return (
        <>
          <button onClick={() => setOn(false)}>unmount</button>
          {on ? <Registrar commands={[cmd("Items", { shortcut: "g i", run })]} /> : null}
        </>
      );
    }
    await renderApp({ extra: <Toggle /> });
    await user.click(screen.getByText("unmount"));
    await user.keyboard("gi");
    expect(run).not.toHaveBeenCalled();
  });

  it("a shortcut whose command fails opens the palette with the error row", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Flaky", { shortcut: "g f", run: () => Promise.reject(new Error("nope")) })]} /> });
    await user.keyboard("gf");
    expect(await screen.findByRole("alert")).toHaveTextContent("Flaky failed: Something went wrong. Try again.");
  });

  it("a shortcut whose command has children opens the palette in that view", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("Move to...", { shortcut: "g m", children: [cmd("Inbox")] })]} /> });
    await user.keyboard("gm");
    expect(await screen.findByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Move to...");
    expect(optionTitles()).toEqual(["Inbox"]);
  });

  it("does not fire bare-key shortcuts while typing in a field", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("Items", { shortcut: "g i", run })]} /> });
    await user.click(screen.getByLabelText("page field"));
    await user.keyboard("gi");
    expect(run).not.toHaveBeenCalled();
  });

  it("does not fire while the palette is open", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    await renderApp({ extra: <Registrar commands={[cmd("Items", { shortcut: "g i", run })]} /> });
    await openPalette(user);
    await user.keyboard("gi");
    expect(run).not.toHaveBeenCalled();
    expect(combobox()).toHaveValue("gi");
  });

  it("the Keyboard shortcuts built-in lists registered shortcuts", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("New thing", { shortcut: "mod+shift+n" }), cmd("No key")]} /> });
    await openPalette(user);
    await user.keyboard("keyboard sh{Enter}");
    const crumbs = await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(crumbs).toHaveTextContent("Keyboard shortcuts");
    const titles = optionTitles();
    expect(titles.some((t) => t.includes("New thing"))).toBe(true);
    expect(titles.some((t) => t.includes("Open command palette"))).toBe(true);
    expect(titles.some((t) => t.includes("No key"))).toBe(false);
  });
});

describe("mobile sheet", () => {
  it("has a visible Close button for phones (there is no Esc key), hidden from sm up, that closes the palette", async () => {
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    const close = screen.getByRole("button", { name: "Close command palette" });
    expect(close.className).toContain("sm:hidden");
    await user.click(close);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("is a top-placed bare panel that becomes a full-height sheet below 640px", async () => {
    const user = userEvent.setup();
    await renderApp({ extra: <Registrar commands={[cmd("One")]} /> });
    await openPalette(user);
    const d = screen.getByRole("dialog");
    expect(d).toHaveAttribute("data-placement", "top");
    expect(d.className).toContain("panel");
    expect(d.className).toContain("max-sm:h-(--command-vv-height,100dvh)");
    expect(d.className).toContain("max-sm:w-screen");
    expect(d.className).not.toContain("!");
    const row = screen.getAllByRole("option")[0];
    expect(row?.className).toContain("min-h-(--control-h)");
    expect(row?.className).toContain("max-sm:min-h-11");
  });

  it("tracks the visual viewport only while the sheet layout applies, so the keyboard does not cover results", async () => {
    setViewportWidth(390);
    const listeners: Record<string, () => void> = {};
    const vv = {
      height: 400,
      offsetTop: 0,
      addEventListener: (t: string, cb: () => void) => void (listeners[t] = cb),
      removeEventListener: () => undefined,
    };
    vi.stubGlobal("visualViewport", vv);
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Open command palette" }));
    await screen.findByRole("dialog");
    expect(document.documentElement.style.getPropertyValue("--command-vv-height")).toBe("400px");
    vv.height = 250;
    act(() => listeners.resize?.());
    expect(document.documentElement.style.getPropertyValue("--command-vv-height")).toBe("250px");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.documentElement.style.getPropertyValue("--command-vv-height")).toBe(""));
  });

  it("does not touch the viewport variables on desktop", async () => {
    vi.stubGlobal("visualViewport", { height: 400, offsetTop: 0, addEventListener: () => undefined, removeEventListener: () => undefined });
    const user = userEvent.setup();
    await renderApp();
    await openPalette(user);
    expect(document.documentElement.style.getPropertyValue("--command-vv-height")).toBe("");
  });

  it("the trigger is the ui button, icon-only below 640px by CSS, and always named", async () => {
    await renderApp();
    const t = screen.getByRole("button", { name: "Open command palette" });
    expect(t.className).toContain("btn");
    expect(t.className).toContain("max-sm:w-(--target-h)");
    expect(within(t).getByText("Search").className).toContain("max-sm:hidden");
  });
});

describe("testing the palette under jsdom", () => {
  it("opens on Ctrl+K dispatched at the document or an element, but not at window", async () => {
    const { fireEvent } = await import("@testing-library/react");
    await renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});

describe("the empty palette's order and the route opt-out", () => {
  it("leads with the app's own groups; Go to, General and Platform follow; a query keeps best-match order", async () => {
    const user = userEvent.setup();
    await renderApp({
      extra: <Registrar commands={[{ ...cmd("Add a note"), group: "Notes" }, { ...cmd("Platform thing"), group: "Platform" }]} />,
    });
    await openPalette(user);
    const groups = within(screen.getByRole("listbox")).getAllByRole("group").map((g) => g.getAttribute("aria-label") ?? g.textContent ?? "");
    const at = (name: string) => groups.findIndex((g) => g.includes(name));
    expect(at("Notes")).toBeGreaterThanOrEqual(0);
    expect(at("Notes")).toBeLessThan(at("Go to"));
    expect(at("Go to")).toBeLessThan(at("Platform"));
  });

  it("a route with staticData palette:false is not listed under Go to", async () => {
    const user = userEvent.setup();
    const { navigationCommands } = await import("../../src/cmdk/builtins");
    const router = {
      routesByPath: {
        "/games": { options: { staticData: { title: "Games" } } },
        "/enter": { options: { staticData: { title: "Enter", palette: false } } },
      },
      navigate: () => undefined,
    } as never;
    expect(navigationCommands(router).map((c) => c.title)).toEqual(["Games"]);
    void user;
  });
});
