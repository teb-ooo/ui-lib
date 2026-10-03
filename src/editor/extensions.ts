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
  addAttributes: () => ({ id: { default: "" }, label: { default: "" } }),
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
