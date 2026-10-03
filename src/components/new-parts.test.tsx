import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip, Dialog, Diff, diffWords, FieldGrid, FieldRow, Graph, handleSuggestionKey, hopsFrom, layoutRings, SuggestionList } from "../index";

describe("Dialog placement right", () => {
  it("opens as a drawer docked to the right", async () => {
    render(<Dialog placement="right" defaultOpen title="Revisions" />);
    const popup = await screen.findByRole("dialog", { name: "Revisions" });
    expect(popup).toHaveAttribute("data-placement", "right");
    expect(popup.className).toContain("right-0");
    expect(popup.className).toContain("anim-slide-right");
  });
});

describe("FieldGrid", () => {
  it("lists rows with their labels and marks drafts", () => {
    render(
      <FieldGrid label="Fields">
        <FieldRow label="Name">Mira</FieldRow>
        <FieldRow label="Summary" draft actions={<button type="button">Edit</button>}>
          Unsure
        </FieldRow>
      </FieldGrid>,
    );
    expect(screen.getByLabelText("Fields").tagName).toBe("DL");
    expect(screen.getByText("Name").tagName).toBe("DT");
    expect(screen.getByText("Unsure").className).toContain("text-ink-muted");
    expect(screen.getByText("Mira").className).toContain("text-ink");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});

describe("Chip actions", () => {
  it("removes", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove} removeLabel="Remove Mira">Mira</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Remove Mira" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
  it("toggles the lock and names the action", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Chip locked={false} onLockedChange={onChange}>draft</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Lock" }));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Chip locked onLockedChange={onChange}>canon</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
  it("has no controls by default", () => {
    render(<Chip>plain</Chip>);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("diffWords", () => {
  it.each([
    ["a b c", "a b c", [{ kind: "same", text: "a b c" }]],
    ["a b", "a b c", [{ kind: "same", text: "a b" }, { kind: "add", text: " c" }]],
    ["a b c", "a c", [{ kind: "same", text: "a " }, { kind: "del", text: "b " }, { kind: "same", text: "c" }]],
    ["old", "new", [{ kind: "del", text: "old" }, { kind: "add", text: "new" }]],
    ["", "x", [{ kind: "add", text: "x" }]],
    ["", "", []],
  ])("%j -> %j", (a, b, want) => {
    expect(diffWords(a, b)).toEqual(want);
  });
  it("reconstructs both sides", () => {
    const a = "the quick brown fox jumps";
    const b = "the slow brown dog jumps high";
    const t = diffWords(a, b);
    expect(t.filter((x) => x.kind !== "add").map((x) => x.text).join("")).toBe(a);
    expect(t.filter((x) => x.kind !== "del").map((x) => x.text).join("")).toBe(b);
  });
});

describe("Diff", () => {
  it("marks additions and removals with text, not only colour", () => {
    const { container } = render(<Diff before="a b" after="a c" />);
    expect(container.querySelector("del")?.textContent).toContain("removed");
    expect(container.querySelector("ins")?.textContent).toContain("added");
  });
  it("splits into before and after", () => {
    render(<Diff layout="split" before="a b" after="a c" />);
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });
  it("accepts tokens", () => {
    const { container } = render(<Diff tokens={[{ kind: "add", text: "new" }]} />);
    expect(container.querySelector("ins")).not.toBeNull();
  });
});

describe("handleSuggestionKey", () => {
  const make = () => ({ count: 3, activeIndex: 2, onActiveIndexChange: vi.fn(), onSelect: vi.fn(), onClose: vi.fn() });
  it("wraps down and up", () => {
    const o = make();
    expect(handleSuggestionKey({ key: "ArrowDown" }, o)).toBe(true);
    expect(o.onActiveIndexChange).toHaveBeenCalledWith(0);
    handleSuggestionKey({ key: "ArrowUp" }, { ...o, activeIndex: 0 });
    expect(o.onActiveIndexChange).toHaveBeenLastCalledWith(2);
  });
  it("chooses on Enter and Tab, closes on Escape, ignores others", () => {
    const o = make();
    handleSuggestionKey({ key: "Enter" }, o);
    handleSuggestionKey({ key: "Tab" }, o);
    expect(o.onSelect).toHaveBeenCalledTimes(2);
    handleSuggestionKey({ key: "Escape" }, o);
    expect(o.onClose).toHaveBeenCalled();
    expect(handleSuggestionKey({ key: "a" }, o)).toBe(false);
  });
  it("lets Enter through when the list is empty", () => {
    const o = { ...make(), count: 0 };
    expect(handleSuggestionKey({ key: "Enter" }, o)).toBe(false);
  });
});

describe("SuggestionList", () => {
  const items = [{ id: "a", label: "Alpha", hint: "Place" }, { id: "b", label: "Beta" }];
  it("is a listbox with options, the active one selected", async () => {
    const onSelect = vi.fn();
    render(<SuggestionList open items={items} activeIndex={1} onSelect={onSelect} anchor={() => new DOMRect(10, 10, 0, 16)} label="Entries" id="s" />);
    const list = await screen.findByRole("listbox", { name: "Entries" });
    const opts = within(list).getAllByRole("option");
    expect(opts).toHaveLength(2);
    expect(opts[1]).toHaveAttribute("aria-selected", "true");
    expect(opts[1]).toHaveAttribute("id", "s-option-1");
    await userEvent.click(opts[0]!);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });
  it("says when nothing matches", async () => {
    render(<SuggestionList open items={[]} activeIndex={0} onSelect={() => undefined} anchor={null} label="Entries" />);
    expect(await screen.findByText("No matches")).toBeInTheDocument();
  });
  it("renders nothing when closed", () => {
    render(<SuggestionList open={false} items={items} activeIndex={0} onSelect={() => undefined} anchor={null} label="Entries" />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("graph layout", () => {
  const nodes = ["c", "a", "b", "d"].map((id) => ({ id, label: id.toUpperCase(), kind: "k" }));
  const edges = [{ source: "c", target: "a" }, { source: "c", target: "b" }, { source: "b", target: "d" }];
  it("counts hops both ways", () => {
    expect([...hopsFrom("c", edges)]).toEqual([["c", 0], ["a", 1], ["b", 1], ["d", 2]]);
    expect(hopsFrom("d", edges).get("c")).toBe(2);
  });
  it("is deterministic, keeps the centre in the middle and stays in bounds", () => {
    const one = layoutRings(nodes, edges, "c", 600);
    expect(layoutRings(nodes, edges, "c", 600)).toEqual(one);
    expect(one.nodes.find((n) => n.id === "c")).toMatchObject({ x: 300, depth: 0 });
    for (const n of one.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(600);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(one.height);
      expect(Number.isFinite(n.x + n.y)).toBe(true);
    }
  });
  it("puts hop 1 on a ring and hop 2 outside it, near its parent", () => {
    const { nodes: laid } = layoutRings(nodes, edges, "c", 600);
    const at = (id: string) => laid.find((n) => n.id === id)!;
    const c = at("c");
    const r = (id: string) => Math.hypot((at(id).x - c.x) / 1, (at(id).y - c.y) / 1);
    expect(at("d").depth).toBe(2);
    expect(r("d")).toBeGreaterThan(r("b"));
    // d hangs off b, so it is nearer b than a.
    const dist = (p: string, q: string) => Math.hypot(at(p).x - at(q).x, at(p).y - at(q).y);
    expect(dist("d", "b")).toBeLessThan(dist("d", "a"));
  });
  it("keeps nodes apart and grows the height with the node count", () => {
    const l = layoutRings(nodes, edges, "c", 600).nodes;
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) expect(Math.hypot(l[i]!.x - l[j]!.x, l[i]!.y - l[j]!.y)).toBeGreaterThan(30);
    const many = Array.from({ length: 15 }, (_, i) => ({ id: `m${i}`, label: `Node number ${i}`, kind: "k" }));
    const all = [{ id: "c", label: "Centre", kind: "k" }, ...many];
    const spokes = many.map((m) => ({ source: "c", target: m.id }));
    const big = layoutRings(all, spokes, "c", 390);
    expect(big.height).toBeGreaterThan(layoutRings(nodes, edges, "c", 390).height);
    for (const n of big.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(390);
    }
  });
});

describe("Graph", () => {
  const nodes = [
    { id: "c", label: "Centre", kind: "person" },
    { id: "a", label: "Alpha", kind: "place", draft: true },
    { id: "d", label: "Deep", kind: "place" },
  ];
  const edges = [{ source: "c", target: "a", label: "near", draft: true }, { source: "a", target: "d", label: "by" }];
  const kinds = { person: { label: "Person" }, place: { label: "Place" } };

  it("shows nodes as focusable buttons with full names", async () => {
    const onNodeSelect = vi.fn();
    render(<Graph nodes={nodes} edges={edges} centerId="c" kinds={kinds} onNodeSelect={onNodeSelect} />);
    const alpha = screen.getByRole("button", { name: "Alpha, Place, draft, 1 hop" });
    expect(alpha).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Centre, Person, centre" })).toBeInTheDocument();
    alpha.focus();
    await userEvent.keyboard("{Enter}");
    expect(onNodeSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });
  it("limits to the chosen number of hops", async () => {
    render(<Graph nodes={nodes} edges={edges} centerId="c" kinds={kinds} />);
    expect(screen.getByRole("button", { name: /^Deep/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "1 hop" }));
    expect(screen.queryByRole("button", { name: /^Deep/ })).toBeNull();
  });
  it("offers the relations as a list", async () => {
    render(<Graph nodes={nodes} edges={edges} centerId="c" kinds={kinds} label="Relations of Centre" />);
    await userEvent.click(screen.getByRole("button", { name: "List" }));
    const list = screen.getByRole("list", { name: "Relations of Centre" });
    expect(within(list).getByText(/near → Alpha/)).toBeInTheDocument();
    expect(within(list).getByText("Deep")).toBeInTheDocument();
  });
  it("legend shows every type", () => {
    render(<Graph nodes={nodes} edges={edges} centerId="c" kinds={kinds} />);
    const legend = screen.getByRole("list", { name: "Legend" });
    expect(within(legend).getByText("Person")).toBeInTheDocument();
    expect(within(legend).getByText("Place")).toBeInTheDocument();
    expect(within(legend).getByText("Draft")).toBeInTheDocument();
  });
  it("renders links when nodeHref is given", () => {
    render(<Graph nodes={nodes} edges={edges} centerId="c" kinds={kinds} nodeHref={(n) => `/e/${n.id}`} />);
    expect(document.querySelector('a[href="/e/a"]')).not.toBeNull();
  });
});

describe("Graph labels", () => {
  it("keeps relation labels clear of each other and of node names", () => {
    const names = ["Centre", "Alpha", "Bravo", "Charlie", "Delta", "Echo"];
    const nodes = names.map((label, i) => ({ id: `n${i}`, label, kind: "k" }));
    const edges = names.slice(1).map((_, i) => ({ source: "n0", target: `n${i + 1}`, label: `relation ${i + 1}` }));
    const { container } = render(<Graph nodes={nodes} edges={edges} centerId="n0" />);
    const boxes = [...container.querySelectorAll("svg text")].map((t) => {
      const w = (t.textContent ?? "").length * 8.6;
      // A node's name is drawn relative to its group's translate; a relation label is in absolute coordinates.
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(t.closest("[transform]")?.getAttribute("transform") ?? "");
      const ox = Number(m?.[1] ?? 0);
      const oy = Number(m?.[2] ?? 0);
      return { text: t.textContent ?? "", x: ox + Number(t.getAttribute("x") ?? 0) - w / 2, y: oy + Number(t.getAttribute("y") ?? 0) - 13, w, h: 17 };
    });
    // Six names; a relation label that cannot be placed clear is left out, so only some of the five show.
    expect(boxes.length).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlap = a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
        expect(overlap, `${a.text} / ${b.text}`).toBe(false);
      }
    }
  });
});

describe("Graph rings, a busy network", () => {
  it("busy at several widths has no overlapping name boxes", () => {
    const nodes = [{ id: "coast", label: "The Saltmere Coast", kind: "p" }, ...["Harbour of Reeds", "Captain Ilsa Marr", "The Drowned Bell", "Saltmere Guild", "Gull Rock", "Tomas Reed", "Ferry of Ash", "Lighthouse Keepers", "Old Fish Market", "The Pale Tide", "Brine Smugglers", "Marr's Ledger", "Reed Family"].map((label, i) => ({ id: `n${i}`, label, kind: "p" }))];
    const edges = [...nodes.slice(1, 8).map((n) => ({ source: "coast", target: n.id })), { source: "n1", target: "n7" }, { source: "n0", target: "n8" }, { source: "n2", target: "n9" }, { source: "n3", target: "n10" }, { source: "n1", target: "n11" }, { source: "n5", target: "n12" }, { source: "n4", target: "n7" }];
    for (const w of [320, 358, 390, 480, 640, 974]) {
      const { nodes: l } = layoutRings(nodes, edges, "coast", w);
      const boxes = l.flatMap((n) => { const c = n.labelChars ?? 18; const lw = Math.min(n.label.length, c) * 8.6; const r = n.depth === 0 ? 16 : 12; return [{ id: n.id + "s", x: n.x - r, y: n.y - r, w: 2 * r, h: 2 * r }, { id: n.id + "l", x: n.x - lw / 2, y: n.labelAbove ? n.y - r - 20 : n.y + r + 2, w: lw, h: 17 }]; });
      const bad: string[] = [];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i]!, b = boxes[j]!; if (a.id.slice(0, -1) === b.id.slice(0, -1)) continue; if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) bad.push(a.id + "/" + b.id); }
      expect(bad, `width ${w}`).toEqual([]);
    }
  });
});

describe("Graph layout centring and label sides", () => {
  const nodes = ["Return of the Kindled King", "The Ashen Hand", "The Kindled King", "The Ember Gate"].map((label, i) => ({ id: `n${i}`, label, kind: "k" }));
  const edges = [1, 2, 3].map((i) => ({ source: "n0", target: `n${i}` }));
  it("the picture is centred in its frame: equal room above and below what is drawn", () => {
    const { nodes: laid, height } = layoutRings(nodes, edges, "n0", 640);
    let top = Infinity;
    let bottom = -Infinity;
    for (const n of laid) {
      const r = n.depth === 0 ? 16 : 12;
      top = Math.min(top, n.labelAbove ? n.y - r - 20 : n.y - r);
      bottom = Math.max(bottom, n.labelAbove ? n.y + r : n.y + r + 20);
    }
    expect(Math.abs(top - (height - bottom))).toBeLessThan(2);
  });
  it("the centre keeps its whole name, and names in the upper half are drawn above their node (away from the edges)", () => {
    const { nodes: laid } = layoutRings(nodes, edges, "n0", 640);
    const c = laid.find((n) => n.id === "n0")!;
    expect(c.labelChars).toBeGreaterThanOrEqual(26);
    for (const n of laid.filter((x) => x.depth > 0)) expect(Boolean(n.labelAbove)).toBe(n.y < c.y - 6);
  });
});
