import { useState } from "react";
import { RichTextEditor } from "./index";
import type { JSONContent } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "RichTextEditor",
  group: "Molecules",
  description:
    "The shared writing surface (import from @teb-ooo/ui/editor; needs the optional TipTap peers): page-like rich text with no box, a formatting toolbar that shows while you type, a / block menu, [[ entry mentions, a draft mark, ProseMirror JSON in and out.",
  aliases: ["rich text", "wysiwyg", "editor", "tiptap", "writing", "medium", "note editor", "text editor", "mentions", "slash menu"],
  source: "src/editor/editor.tsx",
} satisfies StoryDefault;

const entries = [
  { id: "e1", label: "Mother Meridian", hint: "Character" },
  { id: "e2", label: "Coast of Nwi", hint: "Place" },
  { id: "e3", label: "The Salt Accord", hint: "Event" },
];

const start: JSONContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "History" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Raised on the " },
        { type: "mention", attrs: { id: "e2", label: "Coast of Nwi" } },
        { type: "text", text: ", she keeps one coin that every shrine politely refuses.", marks: [{ type: "draft" }] },
      ],
    },
  ],
};

export const Page = () => {
  const [value, setValue] = useState<JSONContent>(start);
  return (
    <div className="pt-10">
      <RichTextEditor
        label="Body"
        value={value}
        onChange={setValue}
        placeholder="Write here. Type [[ to link another entry, / for blocks."
        draft={{ label: "Draft" }}
        mentions={{ search: (q) => entries.filter((e) => e.label.toLowerCase().includes(q.toLowerCase())) }}
      />
    </div>
  );
};
Page.storyMeta = { description: "Click in the text: the toolbar appears above it. Type / for blocks, [[ to link an entry (Mother, Coast, Salt)." } satisfies StoryMeta;

export const Inline = () => {
  const [value, setValue] = useState<JSONContent>({ type: "doc" });
  return (
    <div className="pt-10">
      <RichTextEditor label="Comment" variant="inline" value={value} onChange={setValue} placeholder="Add a comment" />
    </div>
  );
};
Inline.storyMeta = { description: "The inline variant is as tall as its text, for a comment or a field." } satisfies StoryMeta;

export const ReadOnly = () => <RichTextEditor label="Body" value={start} onChange={() => undefined} readOnly />;
ReadOnly.storyMeta = { description: "Read-only: the same typography, no toolbar, mention chips still clickable." } satisfies StoryMeta;
