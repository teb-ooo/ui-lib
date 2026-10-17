import { useState } from "react";
import { RichTextEditor } from "./index";
import type { JSONContent } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "RichTextEditor",
  group: "Molecules",
  description:
    "The shared writing surface (import from @teb-ooo/ui/editor; needs the optional engine peers): page-like rich text with no box, formatting buttons that show while you type, block and entry menus, a draft mark, ProseMirror JSON in and out.",
  aliases: ["rich text", "wysiwyg", "writing", "note editor", "text editor", "mentions"],
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
Page.storyMeta = { description: "Click in the text: the formatting buttons appear above it. Type / for blocks, [[ to link an entry (Mother, Coast, Salt)." } satisfies StoryMeta;

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
ReadOnly.storyMeta = { description: "Read-only: the same typography, no formatting buttons, mention chips still clickable." } satisfies StoryMeta;

const sample = (n: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='480' height='200'><rect width='480' height='200' fill='%23888'/><text x='20' y='110' font-size='28' fill='white'>Picture ${n}</text></svg>`)}`;

export const WithImages = () => {
  const [value, setValue] = useState<JSONContent>({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "A picture sits in the text as its own block." }] },
      { type: "image", attrs: { id: "1", alt: "Picture 1" } },
      { type: "image", attrs: { id: "2", alt: "A draft picture", draft: true } },
      { type: "paragraph" },
    ],
  });
  return (
    <div className="pt-10">
      <RichTextEditor
        label="Body"
        value={value}
        onChange={setValue}
        draft={{ label: "Draft" }}
        images={{ src: (id) => sample(Number(id)), pick: async () => ({ id: String(1 + Math.floor(Math.random() * 3)), alt: "A picture" }) }}
      />
    </div>
  );
};
WithImages.storyMeta = { description: "images={{ src, pick }}: type / and choose Image; click a picture and press Backspace to remove it; with it selected the Draft button marks it as not canon yet." } satisfies StoryMeta;
