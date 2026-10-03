import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCommandSource } from "../../src/cmdk/index";
import type { CommandSource } from "../../src/cmdk/index";
import { renderApp } from "./harness";

function Source({ source }: { source: CommandSource }) {
  useCommandSource(source, [source.id]);
  return null;
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open command palette" }));
  return await screen.findByRole("combobox", { name: "Search commands" });
}

afterEach(() => vi.useRealTimers());

describe("command sources", () => {
  const entries = (found: string[]): CommandSource => ({
    id: "entries",
    group: "Entries",
    debounceMs: 10,
    search: async (q) => found.filter((t) => t.toLowerCase().includes(q.toLowerCase())).map((t) => ({ id: `entry:${t}`, title: t, group: "Entries", run: vi.fn() })),
  });

  it("shows results from the app's API under their group while typing, and runs the chosen one", async () => {
    const run = vi.fn();
    const source: CommandSource = {
      id: "entries",
      group: "Entries",
      debounceMs: 10,
      search: async (q) => [{ id: "e:1", title: `Mother ${q}`, group: "Entries", run }],
    };
    const user = userEvent.setup();
    await renderApp({ extra: <Source source={source} /> });
    const input = await open(user);
    await user.type(input, "mer");
    const row = await screen.findByRole("option", { name: /Mother\s*mer/ });
    expect(within(screen.getByRole("group", { name: "Entries" })).getByRole("option", { name: /Mother\s*mer/ })).toBe(row);
    await user.keyboard("{Enter}");
    // Enter runs the first row, which is the source's result when nothing else matches "mer".
    await waitFor(() => expect(run).toHaveBeenCalled());
  });

  it("asks nothing below minChars, debounces, and aborts the earlier request", async () => {
    const signals: AbortSignal[] = [];
    const search = vi.fn(async (_q: string, signal: AbortSignal) => {
      signals.push(signal);
      return [];
    });
    const user = userEvent.setup();
    await renderApp({ extra: <Source source={{ id: "s", group: "S", debounceMs: 40, search }} /> });
    const input = await open(user);
    await user.type(input, "a");
    await new Promise((r) => setTimeout(r, 80));
    expect(search).not.toHaveBeenCalled();
    await user.type(input, "bc");
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    expect(search.mock.calls[0]?.[0]).toBe("abc");
    await user.type(input, "d");
    await user.clear(input);
    expect(signals[0]?.aborted).toBe(true);
  });

  it("shows Searching while it waits and a quiet line when the source fails, never breaking the palette", async () => {
    let release: (v: []) => void = () => undefined;
    const slow: CommandSource = { id: "slow", group: "Slow", debounceMs: 0, search: () => new Promise((r) => (release = r as typeof release)) };
    const broken: CommandSource = { id: "broken", group: "Broken", debounceMs: 0, search: async () => Promise.reject(new Error("boom")) };
    const user = userEvent.setup();
    await renderApp({ extra: (
      <>
        <Source source={slow} />
        <Source source={broken} />
      </>
    ) });
    const input = await open(user);
    await user.type(input, "zzz");
    expect(await screen.findByText("Searching...")).toBeTruthy();
    expect(await screen.findByText("Could not search broken")).toBeTruthy();
    expect(screen.queryByText("No results")).toBeNull();
    await act(async () => release([]));
    await waitFor(() => expect(screen.queryByText("Searching...")).toBeNull());
  });

  it("does not search inside a nested view", async () => {
    const search = vi.fn(async () => []);
    const user = userEvent.setup();
    await renderApp({ extra: <Source source={{ id: "s", group: "S", debounceMs: 0, search }} /> });
    const input = await open(user);
    await user.type(input, "keyboard sh");
    await waitFor(() => expect(search).toHaveBeenCalled());
    search.mockClear();
    await user.keyboard("{Enter}"); // Keyboard shortcuts: a nested view
    await screen.findByText("Keyboard shortcuts", { selector: "button, [role=button], nav *" }).catch(() => undefined);
    await user.type(screen.getByRole("combobox"), "ab");
    await new Promise((r) => setTimeout(r, 60));
    expect(search).not.toHaveBeenCalled();
  });

  it("limits the results", async () => {
    const many = Array.from({ length: 20 }, (_, i) => `Entry ${i}`);
    const user = userEvent.setup();
    await renderApp({ extra: <Source source={{ ...entries(many), limit: 3 }} /> });
    await user.type(await open(user), "entry");
    await screen.findByRole("option", { name: /Entry\s*0/ });
    expect(within(screen.getByRole("group", { name: "Entries" })).getAllByRole("option")).toHaveLength(3);
  });
});

describe("command hint", () => {
  it("shows the hint after the title of a result", async () => {
    const user = userEvent.setup();
    const source: CommandSource = {
      id: "h",
      group: "Entries",
      debounceMs: 0,
      search: async () => [{ id: "e:1", title: "Harbour of Reeds", hint: "City", group: "Entries", run: vi.fn() }],
    };
    await renderApp({ extra: <Source source={source} /> });
    await user.type(await open(user), "har");
    const row = await screen.findByRole("option", { name: /Harbour of Reeds/ });
    expect(within(row).getByText("City")).toBeTruthy();
  });
});

describe("command source highlighting", () => {
  it("marks the typed letters in a source result's title", async () => {
    const user = userEvent.setup();
    const source: CommandSource = { id: "h", group: "Entries", debounceMs: 0, search: async () => [{ id: "e:1", title: "Ember Gate", group: "Entries", run: vi.fn() }] };
    await renderApp({ extra: <Source source={source} /> });
    await user.type(await open(user), "emb");
    const row = await screen.findByRole("option", { name: /Ember Gate/ });
    expect(row.querySelectorAll("mark, [data-match], b, strong").length).toBeGreaterThan(0);
  });
});
