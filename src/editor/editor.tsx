import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Code, Heading2, Italic, List, ListOrdered, Quote, Stamp } from "lucide-react";
import { Button, SuggestionList, handleSuggestionKey } from "@teb-ooo/ui";
import type { SuggestionItem } from "@teb-ooo/ui";
import { cn } from "../lib/cn";
import { Draft, Mention, suggestExtension } from "./extensions";
import type { SuggestionBridge, SuggestionState } from "./extensions";

export type { JSONContent };

export interface MentionItem {
  id: string;
  label: string;
  /** Quiet text after the label, such as the entry's type. */
  hint?: string;
}

export interface RichTextEditorProps {
  /** Accessible name of the editing area ("Body"). */
  label: string;
  /** The document as ProseMirror JSON (TipTap's camelCase node names). An empty document is \`{ type: "doc" }\`. */
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  placeholder?: string;
  readOnly?: boolean;
  /** Entries to link: typing \`[[\` searches them and Enter inserts an atomic mention chip. */
  mentions?: {
    search: (query: string) => Promise<MentionItem[]> | MentionItem[];
    /** Called when a mention chip is clicked. */
    onClick?: (id: string) => void;
  };
  /** Adds the draft mark (muted text that is not canon yet) and a toolbar toggle named \`label\`. */
  draft?: { label: string };
  /** Which link targets are allowed. Links are not autolinked; this validates a pasted or parsed \`href\`. Default: http, https and mailto. */
  validateHref?: (href: string) => boolean;
  /** \`page\`: at least 6rem tall, a click on the empty area below the text focuses the end. \`inline\`: as tall as its text. @default "page" */
  variant?: "page" | "inline";
  /** Called when the empty area below the text is clicked (the editor then focuses the end of the text). */
  onFocusEnd?: () => void;
  /**
   * Where the formatting toolbar sits. `reserved`: in a strip of its own above the text (one control tall), invisible until
   * the editor has focus, so it never covers a neighbour and nothing moves when it appears. `overlay`: floats above the text
   * without taking space, for a page with room above the editor.
   * @default "reserved"
   */
  toolbar?: "reserved" | "overlay";
  className?: string;
}

const defaultValidate = (href: string) => /^(https?:\/\/|mailto:)/i.test(href);
const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** Normalises ProseMirror JSON: an empty document is \`{ type: "doc" }\`, with no \`content\` key. */
function outgoing(editor: Editor): JSONContent {
  const json = editor.getJSON();
  const only = json.content?.length === 1 && json.content[0]?.type === "paragraph" && !json.content[0].content;
  return only || !json.content?.length ? { type: "doc" } : json;
}
const incoming = (doc: JSONContent): JSONContent => (doc.content?.length ? doc : EMPTY);
const same = (a: JSONContent, b: JSONContent) => JSON.stringify(a) === JSON.stringify(b);

const BLOCKS = [
  { id: "heading", label: "Heading" },
  { id: "text", label: "Text" },
  { id: "bullet", label: "Bullet list" },
  { id: "numbered", label: "Numbered list" },
  { id: "quote", label: "Quote" },
  { id: "divider", label: "Divider" },
] as const;

type ListState<T> = SuggestionState<T>;
const closedList = <T,>(): ListState<T> => ({ open: false, items: [], index: 0, rect: null, choose: null });

/**
 * The shared writing surface: page-like rich text with a formatting toolbar that appears while the editor has focus,
 * a \`/\` block menu, \`[[\` entry mentions, a draft mark and ProseMirror JSON in and out. Import it from \`@teb-ooo/ui/editor\`;
 * the TipTap packages (\`@tiptap/react\`, \`@tiptap/core\`, \`@tiptap/pm\`, \`@tiptap/starter-kit\`, \`@tiptap/extension-placeholder\`,
 * \`@tiptap/suggestion\`) are optional peer dependencies the app installs. External changes to \`value\` replace the content
 * only while the editor is not focused.
 */
export function RichTextEditor({ label, value, onChange, placeholder, readOnly = false, mentions, draft, validateHref = defaultValidate, variant = "page", onFocusEnd, toolbar = "reserved", className }: RichTextEditorProps) {
  const [slash, setSlash] = useState<ListState<SuggestionItem>>(closedList());
  const [ment, setMent] = useState<ListState<SuggestionItem>>(closedList());
  const slashRef = useRef(slash);
  const mentRef = useRef(ment);
  slashRef.current = slash;
  mentRef.current = ment;
  const latest = useRef({ onChange, mentions, validateHref, value });
  latest.current = { onChange, mentions, validateHref, value };

  const extensions = useMemo(() => {
    const bridge = <T extends SuggestionItem>(get: () => ListState<T>, set: (s: ListState<T>) => void): SuggestionBridge<T> => ({
      set: (s) => set({ ...get(), ...s }),
      onKey: (event) =>
        handleSuggestionKey(event, {
          count: get().items.length,
          activeIndex: get().index,
          onActiveIndexChange: (i) => set({ ...get(), index: i }),
          onSelect: () => {
            const item = get().items[get().index];
            if (item) get().choose?.(item);
          },
          onClose: () => set(closedList()),
        }),
    });
    const list: unknown[] = [
      StarterKit.configure({
        strike: false,
        underline: false,
        hardBreak: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: false, linkOnPaste: false, isAllowedUri: (href: string) => latest.current.validateHref(href) },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      Mention,
      Draft,
      suggestExtension<SuggestionItem>({
        name: "slashMenu",
        char: "/",
        startOfLine: false,
        items: (q) => [...BLOCKS, ...(latest.current.mentions ? [{ id: "link", label: "Link an entry" }] : [])].filter((b) => b.label.toLowerCase().includes(q.toLowerCase())),
        command: ({ editor, range, item }) => {
          const chain = editor.chain().focus().deleteRange(range);
          if (item.id === "heading") chain.setNode("heading", { level: 2 }).run();
          else if (item.id === "text") chain.setNode("paragraph").run();
          else if (item.id === "bullet") chain.toggleBulletList().run();
          else if (item.id === "numbered") chain.toggleOrderedList().run();
          else if (item.id === "quote") chain.setBlockquote().run();
          else if (item.id === "divider") chain.setHorizontalRule().run();
          else if (item.id === "link") chain.insertContent("[[").run();
          else chain.run();
        },
        bridge: bridge(() => slashRef.current, setSlash),
      }),
      suggestExtension<SuggestionItem>({
        name: "mentionMenu",
        char: "[[",
        allowSpaces: true,
        items: async (q) => (await (latest.current.mentions?.search(q) ?? [])).map((m) => ({ id: m.id, label: m.label, ...(m.hint !== undefined ? { hint: m.hint } : {}) })),
        command: ({ editor, range, item }) => {
          editor.chain().focus().insertContentAt(range, [{ type: "mention", attrs: { id: item.id, label: String(item.label) } }, { type: "text", text: " " }]).run();
        },
        bridge: bridge(() => mentRef.current, setMent),
      }),
    ];
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  const editor = useEditor({
    extensions: extensions as never,
    content: incoming(value),
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      // An update that leaves the document as the app already has it (setup, normalising) is not a change.
      const next = outgoing(e);
      if (!same(next, latest.current.value)) latest.current.onChange(next);
    },
    editorProps: {
      attributes: { role: "textbox", "aria-multiline": "true", "aria-label": label, class: "prose outline-none" + (variant === "page" ? " min-h-24" : "") },
      handleDOMEvents: {
        // Cmd or Ctrl+I is italic here: keep it from reaching the platform's Send feedback hotkey on the document.
        keydown: (_view, event) => {
          if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "i") event.stopPropagation();
          return false;
        },
        click: (_view, event) => {
          const el = (event.target as HTMLElement | null)?.closest?.("[data-mention-id]");
          if (el) latest.current.mentions?.onClick?.(el.getAttribute("data-mention-id") ?? "");
          return false;
        },
      },
    },
  });

  // External value changes replace the content only while the editor is not focused.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (!same(outgoing(editor), value)) editor.commands.setContent(incoming(value), { emitUpdate: false });
  }, [editor, value]);
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? { focused: e.isFocused, bold: e.isActive("bold"), italic: e.isActive("italic"), code: e.isActive("code"), h2: e.isActive("heading", { level: 2 }), bullet: e.isActive("bulletList"), numbered: e.isActive("orderedList"), quote: e.isActive("blockquote"), draft: e.isActive("draft") }
        : null,
  });

  if (!editor) return null;
  const tb = (name: string, icon: React.ReactNode, on: boolean | undefined, run: () => void) => (
    <Button key={name} icon={icon} aria-label={name} tip={name} active={on} onMouseDown={(e) => e.preventDefault()} onClick={run} className="border-transparent" />
  );
  return (
    <div className={cn("relative", !readOnly && toolbar === "reserved" && "pt-8", className)}>
      {readOnly ? null : (
        <div
          role="toolbar"
          aria-label="Formatting"
          className={cn("absolute left-0 z-10 flex flex-wrap items-center gap-1 transition-opacity duration-100", toolbar === "reserved" ? "top-0" : "-top-9", active?.focused ? "opacity-100" : "pointer-events-none opacity-0")}
        >
          {tb("Bold", <Bold className="size-4" aria-hidden="true" />, active?.bold, () => editor.chain().focus().toggleBold().run())}
          {tb("Italic", <Italic className="size-4" aria-hidden="true" />, active?.italic, () => editor.chain().focus().toggleItalic().run())}
          {tb("Code", <Code className="size-4" aria-hidden="true" />, active?.code, () => editor.chain().focus().toggleCode().run())}
          {tb("Heading", <Heading2 className="size-4" aria-hidden="true" />, active?.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          {tb("Bullet list", <List className="size-4" aria-hidden="true" />, active?.bullet, () => editor.chain().focus().toggleBulletList().run())}
          {tb("Numbered list", <ListOrdered className="size-4" aria-hidden="true" />, active?.numbered, () => editor.chain().focus().toggleOrderedList().run())}
          {tb("Quote", <Quote className="size-4" aria-hidden="true" />, active?.quote, () => editor.chain().focus().toggleBlockquote().run())}
          {draft ? tb(draft.label, <Stamp className="size-4" aria-hidden="true" />, active?.draft, () => editor.chain().focus().toggleMark("draft").run()) : null}
        </div>
      )}
      <EditorContent
        editor={editor}
        className="editor-surface"
        onClick={(e) => {
          if (variant === "page" && e.target === e.currentTarget) {
            editor.commands.focus("end");
            onFocusEnd?.();
          }
        }}
      />
      <SuggestionList
        open={slash.open}
        items={slash.items}
        activeIndex={slash.index}
        onActiveIndexChange={(i) => setSlash({ ...slash, index: i })}
        onSelect={(item) => slash.choose?.(item)}
        onClose={() => setSlash(closedList())}
        anchor={slash.rect}
        label="Insert block"
        id="editor-blocks"
      />
      <SuggestionList
        open={ment.open}
        items={ment.items}
        activeIndex={ment.index}
        onActiveIndexChange={(i) => setMent({ ...ment, index: i })}
        onSelect={(item) => ment.choose?.(item)}
        onClose={() => setMent(closedList())}
        anchor={ment.rect}
        label="Link an entry"
        id="editor-mentions"
      />
    </div>
  );
}

