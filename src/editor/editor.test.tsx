import { beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

describe("images in the body", () => {
  const withImage = (draft?: boolean) => ({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Before" }] },
      { type: "image", attrs: { id: "img-1", alt: "A map of the coast", ...(draft ? { draft: true } : {}) } },
    ],
  });
  const images = (pick: () => Promise<{ id: string; alt: string } | null> = async () => null) => ({ src: (id: string) => `/api/images/${id}/content`, pick });

  it("draws an image block from images.src, in read-only mode too, and marks a draft one", async () => {
    const { rerender } = render(<RichTextEditor label="Body" value={withImage()} onChange={() => undefined} images={images()} readOnly />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    const figure = box.querySelector("figure[data-image-id]") as HTMLElement;
    expect(figure.getAttribute("data-image-id")).toBe("img-1");
    const img = figure.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/api/images/img-1/content");
    expect(img.alt).toBe("A map of the coast");
    expect(figure.hasAttribute("data-draft")).toBe(false);
    rerender(<RichTextEditor label="Body" value={withImage(true)} onChange={() => undefined} images={images()} readOnly />);
    await waitFor(() => expect(box.querySelector("figure[data-image-id]")?.hasAttribute("data-draft")).toBe(true));
  });

  it("round-trips: an edit elsewhere keeps the image node with its attributes and adds nothing to them", async () => {
    const onChange = vi.fn();
    render(<RichTextEditor label="Body" value={withImage()} onChange={onChange} images={images()} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    box.focus();
    await userEvent.keyboard("!");
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const out = onChange.mock.calls.at(-1)?.[0] as { content: Array<{ type: string; attrs?: Record<string, unknown> }> };
    const node = out.content.find((n) => n.type === "image");
    expect(JSON.parse(JSON.stringify(node?.attrs))).toEqual({ id: "img-1", alt: "A map of the coast" });
  });

  it("a picture that fails to load is nothing in read-only mode and a quiet line with its alt text while editing", async () => {
    render(<RichTextEditor label="Body" value={withImage()} onChange={() => undefined} images={images()} readOnly />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    (box.querySelector("img") as HTMLImageElement).dispatchEvent(new Event("error"));
    expect((box.querySelector("figure[data-image-id]") as HTMLElement).textContent).toBe("");
    cleanup();
    render(<RichTextEditor label="Body" value={withImage()} onChange={() => undefined} images={images()} />);
    const editing = await screen.findByRole("textbox", { name: "Body" });
    await waitFor(() => expect(editing.querySelector("img")).not.toBeNull());
    (editing.querySelector("img") as HTMLImageElement).dispatchEvent(new Event("error"));
    await waitFor(() => expect((editing.querySelector("figure[data-image-id]") as HTMLElement).textContent).toBe("A map of the coast"));
  });

  it("without the images prop the document keeps the node (as a quiet line) and the menu does not offer Image", async () => {
    render(<RichTextEditor label="Body" value={withImage()} onChange={() => undefined} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    expect((box.querySelector("figure[data-image-id]") as HTMLElement).textContent).toBe("A map of the coast");
    box.focus();
    await userEvent.keyboard("/");
    await screen.findByRole("listbox");
    expect(screen.queryByRole("option", { name: "Image" })).toBeNull();
  });

  it("the / menu offers Image, calls pick, and inserts the chosen picture", async () => {
    const onChange = vi.fn();
    const pick = vi.fn(async () => ({ id: "img-9", alt: "A new one" }));
    render(<RichTextEditor label="Body" value={{ type: "doc" }} onChange={onChange} images={images(pick)} />);
    const box = await screen.findByRole("textbox", { name: "Body" });
    box.focus();
    await userEvent.keyboard("/Image");
    await userEvent.click(await screen.findByRole("option", { name: "Image" }));
    await waitFor(() => expect(pick).toHaveBeenCalled());
    await waitFor(() => expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain('"id":"img-9"'));
    expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain('"alt":"A new one"');
  });
});
