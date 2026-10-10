import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "./combobox";
import { Select } from "./select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

describe("onHighlight", () => {
  it("Select: reports the option the keys or the pointer reach, and null when the list closes", async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    render(<Select label="Scene" options={options} value={null} onValueChange={() => undefined} onHighlight={(v) => seen.push(v)} />);
    await user.click(screen.getByRole("combobox", { name: "Scene" }));
    await screen.findByRole("option", { name: "Alpha" });
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(seen.at(-1)).not.toBeNull());
    const first = seen.at(-1);
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(seen.at(-1)).not.toBe(first));
    await user.hover(screen.getByRole("option", { name: "Gamma" }));
    await waitFor(() => expect(seen.at(-1)).toBe("c"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(seen.at(-1)).toBeNull());
    // no repeats of the same value in a row
    expect(seen.every((v, i) => i === 0 || v !== seen[i - 1])).toBe(true);
  });

  it("Combobox: the same", async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    render(<Combobox label="Scene" options={options} value={null} onValueChange={() => undefined} onHighlight={(v) => seen.push(v)} />);
    await user.click(screen.getByRole("combobox", { name: "Scene" }));
    await screen.findByRole("option", { name: "Beta" });
    await user.hover(screen.getByRole("option", { name: "Beta" }));
    await waitFor(() => expect(seen.at(-1)).toBe("b"));
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(seen.at(-1)).toBe("c"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(seen.at(-1)).toBeNull());
  });
});

describe("Option tip", () => {
  const tipped = [
    { value: "a", label: "Alpha", tip: "The first map: a flat plain." },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma", tip: "The third: all hills." },
  ];

  it("Select: the highlighted option's tip shows at once, follows the arrow keys, describes the option, and goes when the list closes", async () => {
    const user = userEvent.setup();
    render(<Select label="Map" options={tipped} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Map" }));
    await screen.findByRole("option", { name: "Alpha" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    await user.hover(screen.getByRole("option", { name: "Gamma" }));
    expect((await screen.findByRole("tooltip")).textContent).toBe("The third: all hills.");
    expect(screen.getByRole("option", { name: "Gamma" }).getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);
    // an option without a tip shows none
    await user.hover(screen.getByRole("option", { name: "Beta" }));
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    await user.hover(screen.getByRole("option", { name: "Alpha" }));
    expect((await screen.findByRole("tooltip")).textContent).toBe("The first map: a flat plain.");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("Combobox: the same, and the user's onHighlight still fires", async () => {
    const user = userEvent.setup();
    const seen: (string | null)[] = [];
    render(<Combobox label="Map" options={tipped} value={null} onValueChange={() => undefined} onHighlight={(v) => seen.push(v)} />);
    await user.click(screen.getByRole("combobox", { name: "Map" }));
    await screen.findByRole("option", { name: "Alpha" });
    await user.hover(screen.getByRole("option", { name: "Gamma" }));
    expect((await screen.findByRole("tooltip")).textContent).toBe("The third: all hills.");
    expect(seen.at(-1)).toBe("c");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });
});

describe("Option adornment", () => {
  const swatches = [
    { value: "a", label: "Ember", adornment: <span data-testid="sw-a" className="w-16" /> },
    { value: "b", label: "Plain" },
  ];
  it("Select: drawn at the left edge of the row in the list, hidden from assistive technology, and at the start of the closed select for the chosen option", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Select label="Preset" options={swatches} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Preset" }));
    const option = await screen.findByRole("option", { name: "Ember" });
    const swatch = within(option).getByTestId("sw-a");
    expect(swatch.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(within(screen.getByRole("option", { name: "Plain" })).queryByTestId("sw-a")).toBeNull();
    await user.keyboard("{Escape}");
    expect(within(screen.getByRole("combobox", { name: "Preset" })).queryByTestId("sw-a")).toBeNull();
    rerender(<Select label="Preset" options={swatches} value="a" onValueChange={() => undefined} />);
    expect(within(screen.getByRole("combobox", { name: "Preset" })).getByTestId("sw-a")).toBeTruthy();
  });

  it("Combobox: in the list, and at the start of the field for the chosen option", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Combobox label="Preset" options={swatches} value={null} onValueChange={() => undefined} />);
    await user.click(screen.getByRole("combobox", { name: "Preset" }));
    expect(within(await screen.findByRole("option", { name: "Ember" })).getByTestId("sw-a")).toBeTruthy();
    await user.keyboard("{Escape}");
    rerender(<Combobox label="Preset" options={swatches} value="a" onValueChange={() => undefined} />);
    expect(screen.getAllByTestId("sw-a").length).toBeGreaterThan(0);
  });
});
