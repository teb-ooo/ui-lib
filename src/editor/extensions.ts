import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";

/** The muted draft mark: text (or a mention) that is not canon yet. Rendered as `span[data-draft]`. */
export const Draft = Mark.create({
  name: "draft",
  inclusive: false,
  parseHTML: () => [{ tag: "span[data-draft]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-draft": "", class: "text-ink-muted" }), 0],
});

/** An atomic inline link to another entry, drawn as a link chip. Attributes: `id`, `label`. */
export const Mention = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes: () => ({ id: { default: "", rendered: false }, label: { default: "", rendered: false } }),
  parseHTML: () => [
    {
      tag: "span[data-mention-id]",
      getAttrs: (el) => ({ id: (el as HTMLElement).getAttribute("data-mention-id") ?? "", label: (el as HTMLElement).textContent ?? "" }),
    },
  ],
  renderHTML: ({ node, HTMLAttributes }) => [
    "span",
    mergeAttributes(HTMLAttributes, { "data-mention-id": node.attrs.id as string, class: "chip chip-link", contenteditable: "false" }),
    node.attrs.label as string,
  ],
  renderText: ({ node }) => node.attrs.label as string,
});

/** What the editor's React side needs from one suggestion trigger. */
export interface SuggestionState<T> {
  open: boolean;
  items: T[];
  index: number;
  rect: (() => DOMRect | null) | null;
  /** Applies an item through the plugin's own command (replaces the trigger text). */
  choose: ((item: T) => void) | null;
}

export interface SuggestionBridge<T> {
  /** Called by the plugin with the new state; the editor stores it in React state. */
  set: (state: Partial<SuggestionState<T>>) => void;
  /** Return true when the key was handled. */
  onKey: (event: KeyboardEvent) => boolean;
}

export interface SuggestExtensionOptions<T> {
  name: string;
  char: string;
  allowSpaces?: boolean;
  startOfLine?: boolean;
  items: (query: string) => Promise<T[]> | T[];
  /** Applies the chosen item: replaces `range`. */
  command: (args: { editor: SuggestionProps["editor"]; range: SuggestionProps["range"]; item: T }) => void;
  bridge: SuggestionBridge<T>;
}

/** A Suggestion trigger (`/`, `[[`) whose list is drawn by React through `bridge`, so the list is ui's `SuggestionList`. */
export function suggestExtension<T>(o: SuggestExtensionOptions<T>) {
  return Extension.create({
    name: o.name,
    addProseMirrorPlugins() {
      return [
        Suggestion<T, T>({
          pluginKey: new PluginKey(o.name),
          editor: this.editor,
          char: o.char,
          allowSpaces: o.allowSpaces ?? false,
          startOfLine: o.startOfLine ?? false,
          items: ({ query }) => o.items(query),
          command: ({ editor, range, props }) => o.command({ editor, range, item: props }),
          render: () => ({
            onStart: (p: SuggestionProps<T, T>) => o.bridge.set({ open: true, items: p.items, index: 0, rect: p.clientRect ?? null, choose: (item) => p.command(item) }),
            onUpdate: (p: SuggestionProps<T, T>) => o.bridge.set({ open: true, items: p.items, rect: p.clientRect ?? null, choose: (item) => p.command(item) }),
            onKeyDown: ({ event }: SuggestionKeyDownProps) => o.bridge.onKey(event),
            onExit: () => o.bridge.set({ open: false, items: [], index: 0 }),
          }),
        }),
      ];
    },
  });
}

export interface ImageBlockOptions {
  /** The address of an image by id, or null when the editor has none (then the node is drawn as a quiet placeholder). */
  src: (id: string) => string | null;
}

/**
 * A picture as a block: attributes `id` (the app's image id), `alt` and, for an image that is not canon yet, `draft: true`
 * (a block cannot carry the draft mark, so it is an attribute; it is left out of the JSON when false). The picture's `src`
 * comes from the editor's `images` prop. It is atomic and selectable (Backspace or Delete removes it), drawn in read-only mode
 * too; a picture that fails to load is drawn as nothing in read-only mode, and as a quiet line with its alt text while editing,
 * so it can still be selected and removed.
 */
export const ImageBlock = Node.create<ImageBlockOptions>({
  name: "image",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addOptions: () => ({ src: () => null }),
  addAttributes: () => ({
    id: { default: "", rendered: false },
    alt: { default: "", rendered: false },
    draft: { default: undefined, rendered: false },
  }),
  parseHTML: () => [
    {
      tag: "figure[data-image-id]",
      getAttrs: (el) => {
        const e = el as HTMLElement;
        return { id: e.getAttribute("data-image-id") ?? "", alt: e.querySelector("img")?.getAttribute("alt") ?? "", draft: e.hasAttribute("data-draft") ? true : undefined };
      },
    },
  ],
  renderHTML: ({ node }) => [
    "figure",
    { "data-image-id": node.attrs.id as string, ...(node.attrs.draft ? { "data-draft": "" } : {}), class: "my-3", contenteditable: "false" },
    ["img", { alt: node.attrs.alt as string }],
  ],
  renderText: ({ node }) => (node.attrs.alt as string) || "",
  addNodeView() {
    const options = this.options;
    return ({ node: first, editor }) => {
      const dom = document.createElement("figure");
      dom.contentEditable = "false";
      dom.className = "my-3";
      const draw = (attrs: { id: string; alt: string; draft?: boolean }) => {
        dom.setAttribute("data-image-id", attrs.id);
        if (attrs.draft) dom.setAttribute("data-draft", "");
        else dom.removeAttribute("data-draft");
        dom.className = attrs.draft ? "my-3 opacity-60" : "my-3";
        dom.replaceChildren();
        const src = options.src(attrs.id);
        const placeholder = () => {
          // Read-only: nothing, like ImagePreview. Editing: a quiet line, so the block can be selected and removed.
          if (editor.isEditable) {
            const line = document.createElement("div");
            line.className = "flex min-h-[var(--control-h)] items-center rounded border border-line px-2 text-ink-faint";
            line.textContent = attrs.alt || "Image";
            dom.replaceChildren(line);
          } else dom.replaceChildren();
        };
        if (!src) {
          placeholder();
          return;
        }
        const img = document.createElement("img");
        img.alt = attrs.alt;
        img.loading = "lazy";
        img.className = "mx-auto block max-h-[32rem] max-w-full rounded";
        img.addEventListener("error", placeholder);
        img.src = src;
        dom.append(img);
      };
      draw(first.attrs as { id: string; alt: string; draft?: boolean });
      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== "image") return false;
          draw(updated.attrs as { id: string; alt: string; draft?: boolean });
          return true;
        },
      };
    };
  },
});
