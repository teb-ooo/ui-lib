import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandProvider, useRegisterCommands } from "../../src/cmdk/index";
import type { Command } from "../../src/cmdk/index";
import { setDevWarnings } from "../../src/cmdk/dev";
import { renderApp } from "./harness";

const combobox = () => screen.getByRole("combobox", { name: "Search commands" });

describe("afterClose", () => {
  it("runs after the palette closed and focus returned to the previous element", async () => {
    const user = userEvent.setup();
    const seen: Array<{ dialog: boolean; focused: string | null }> = [];
    function Cmds() {
      useRegisterCommands([
        {
          id: "focus-field",
          title: "Focus the field",
          group: "Test",
          run: (ctx) => {
            ctx.afterClose(() => {
              seen.push({ dialog: screen.queryByRole("dialog") !== null, focused: document.activeElement?.getAttribute("aria-label") ?? null });
              (screen.getByLabelText("target") as HTMLElement).focus();
            });
          },
        },
      ]);
      return <input aria-label="target" />;
    }
    await renderApp({ extra: <Cmds /> });
    (screen.getByLabelText("page field") as HTMLElement).focus();
    await user.keyboard("{Control>}k{/Control}");
    await user.type(combobox(), "Focus the field");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toEqual({ dialog: false, focused: "page field" });
    expect(document.activeElement).toBe(screen.getByLabelText("target"));
  });

  it("runs on a microtask when a shortcut ran the command (no palette open)", async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    function Cmds() {
      useRegisterCommands([{ id: "s", title: "Shortcut cmd", group: "Test", shortcut: "g x", run: (ctx) => ctx.afterClose(fn) }]);
      return null;
    }
    await renderApp({ extra: <Cmds /> });
    await user.keyboard("gx");
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));
  });
});

describe("development warnings", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    setDevWarnings(true);
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    setDevWarnings(null);
    warn.mockRestore();
    document.documentElement.style.removeProperty("--cmdk-loaded");
  });
  const messages = (): string[] => warn.mock.calls.map((c: unknown[]) => String(c[0]));

  it("warns when theme.css is missing (no --cmdk-loaded) and is quiet when present", async () => {
    render(<CommandProvider standalone>x</CommandProvider>);
    await waitFor(() => expect(messages().some((m: string) => m.includes("theme.css"))).toBe(true));
    warn.mockClear();
    setDevWarnings(true);
    document.documentElement.style.setProperty("--cmdk-loaded", "1");
    render(<CommandProvider standalone>y</CommandProvider>);
    await act(async () => {});
    expect(messages().some((m: string) => m.includes("theme.css"))).toBe(false);
  });

  it("warns when there is no router, unless `standalone`", async () => {
    document.documentElement.style.setProperty("--cmdk-loaded", "1");
    render(<CommandProvider>x</CommandProvider>);
    await waitFor(() => expect(messages().some((m: string) => m.includes("no router"))).toBe(true));
    warn.mockClear();
    setDevWarnings(true);
    render(<CommandProvider standalone>y</CommandProvider>);
    await act(async () => {});
    expect(messages().some((m: string) => m.includes("no router"))).toBe(false);
  });

  it("warns when the commands change but deps do not; quiet when deps change", async () => {
    document.documentElement.style.setProperty("--cmdk-loaded", "1");
    function Reg({ title, deps }: { title: string; deps?: unknown[] }) {
      const cmds: Command[] = [{ id: "a", title, group: "T" }];
      useRegisterCommands(cmds, deps);
      return null;
    }
    const { rerender } = render(
      <CommandProvider standalone>
        <Reg title="One" />
      </CommandProvider>,
    );
    rerender(
      <CommandProvider standalone>
        <Reg title="Two" />
      </CommandProvider>,
    );
    await waitFor(() => expect(messages().some((m: string) => m.includes("`deps` did not"))).toBe(true));
    warn.mockClear();
    setDevWarnings(true);
    const ok = render(
      <CommandProvider standalone>
        <Reg title="One" deps={["One"]} />
      </CommandProvider>,
    );
    ok.rerender(
      <CommandProvider standalone>
        <Reg title="Two" deps={["Two"]} />
      </CommandProvider>,
    );
    await act(async () => {});
    expect(messages().some((m: string) => m.includes("`deps` did not"))).toBe(false);
  });
});
