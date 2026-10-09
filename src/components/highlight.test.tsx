import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
