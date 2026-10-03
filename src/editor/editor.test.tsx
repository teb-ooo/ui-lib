import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextEditor } from "./index";

beforeAll(() => {
  // ProseMirror measures text with ranges; jsdom has no layout.
  const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) } as DOMRect;
  Range.prototype.getBoundingClientRect = () => rect;
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList;
  document.elementFromPoint = () => null;
});

const doc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "History" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "See " },
        { type: "mention", attrs: { id: "e1", label: "Mother Meridian" } },
        { type: "text", text: " and ", marks: [{ type: "draft" }] },
      ],
    },
  ],
};

describe("RichTextEditor", () => {
  it("is a labelled textbox that draws headings, mention chips and the draft mark from ProseMirror JSON", async () => {
    render(<RichTextEditor label="Body" value={doc} onChange={() => undefined} placeholder="Write here." draft={{ label: "Draft" }} mentions={{ search: () => [] }} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    expect(box.querySelector("h2")?.textContent).toBe("History");
    const chip = box.querySelector("[data-mention-id]") as HTMLElement;
    expect(chip.textContent).toBe("Mother Meridian");
    expect(chip.className).toContain("chip-link");
    expect(box.querySelector("[data-draft]")?.textContent).toBe(" and ");
  });

  it("has a Formatting toolbar with the draft toggle when asked, and none when read-only", async () => {
    const { rerender } = render(<RichTextEditor label="Body" value={doc} onChange={() => undefined} draft={{ label: "Draft" }} />);
    const tb = await screen.findByRole("toolbar", { name: "Formatting" });
    expect(tb.querySelectorAll("button").length).toBe(9);
    expect(screen.getByRole("button", { name: "Link" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Draft" })).toBeTruthy();
    rerender(<RichTextEditor label="Body" value={doc} onChange={() => undefined} readOnly />);
    await waitFor(() => expect(screen.queryByRole("toolbar")).toBeNull());
    expect(screen.getByRole("textbox", { name: "Body" }).getAttribute("contenteditable")).toBe("false");
  });

  it("replaces the content on an external value change while the editor is not focused", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<RichTextEditor label="Body" value={{ type: "doc" }} onChange={onChange} />);
    await screen.findByRole("textbox", { name: "Body" });
    rerender(<RichTextEditor label="Body" value={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }} onChange={onChange} />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Body" }).textContent).toBe("Hello"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("mention markup", () => {
  it("renders only the data attribute, the chip class and the label (no raw attrs)", async () => {
    render(<RichTextEditor label="Body" value={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "mention", attrs: { id: "e1", label: "Meridian" } }] }] }} onChange={() => undefined} />);
    const chip = (await screen.findByRole("textbox", { name: "Body" })).querySelector("[data-mention-id]") as HTMLElement;
    expect(chip.hasAttribute("id")).toBe(false);
    expect(chip.hasAttribute("label")).toBe(false);
    expect(chip.getAttribute("data-mention-id")).toBe("e1");
  });
});

describe("toolbar placement and Cmd+I", () => {
  it("reserves a strip for the toolbar by default and floats it with overlay", async () => {
    const { container, rerender } = render(<RichTextEditor label="Body" value={doc} onChange={() => undefined} />);
    await screen.findByRole("toolbar", { name: "Formatting" });
    expect((container.firstElementChild as HTMLElement).className).toContain("pt-8");
    rerender(<RichTextEditor label="Body" value={doc} onChange={() => undefined} toolbar="overlay" />);
    expect((container.firstElementChild as HTMLElement).className).not.toContain("pt-8");
    expect(screen.getByRole("toolbar", { name: "Formatting" }).className).toContain("-top-9");
  });
  it("keeps Cmd+I from reaching the document (the feedback hotkey)", async () => {
    const seen = vi.fn();
    document.addEventListener("keydown", seen);
    render(<RichTextEditor label="Body" value={doc} onChange={() => undefined} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    box.dispatchEvent(new KeyboardEvent("keydown", { key: "i", ctrlKey: true, bubbles: true, cancelable: true }));
    document.removeEventListener("keydown", seen);
    expect(seen).not.toHaveBeenCalled();
  });

  it("shows a (+) Insert block button on an empty line that types the slash for the block menu", async () => {
    const onChange = vi.fn();
    render(<RichTextEditor label="Body" value={{ type: "doc" }} onChange={onChange} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    expect(screen.queryByRole("button", { name: "Insert block" })).toBeNull();
    box.focus();
    const plus = await screen.findByRole("button", { name: "Insert block" });
    await userEvent.click(plus);
    await waitFor(() => expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain('"/"'));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Insert block" })).toBeNull());
  });
});
