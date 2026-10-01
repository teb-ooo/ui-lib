import { useRef, useState } from "react";
import { Textarea } from "./textarea";
import { handleSuggestionKey, SuggestionList } from "./suggestion-list";
import type { StoryDefault } from "../stories";

export default {
  title: "SuggestionList",
  group: "Molecules",
  description: "A listbox that opens at the text caret while the editor keeps focus, for [[ mentions, @ people or / commands. The editor drives it; the list draws and positions.",
  aliases: ["autocomplete", "mention list", "typeahead", "slash menu", "suggestions", "caret popover", "completion"],
  component: "SuggestionList",
  source: "src/components/suggestion-list.tsx",
} satisfies StoryDefault;

const all = [
  { id: "1", label: "Mira Vance", hint: "Character" },
  { id: "2", label: "Mirewood", hint: "Place" },
  { id: "3", label: "The Miller's Oath", hint: "Event" },
];

export const AtTheCaret = () => {
  const [text, setText] = useState("She met [[Mi");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(true);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const items = all.filter((i) => String(i.label).toLowerCase().includes(text.split("[[").pop()?.toLowerCase() ?? ""));
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={field}
        aria-label="Text with a mention"
        aria-controls="story-suggestions"
        aria-activedescendant={open && items.length > 0 ? `story-suggestions-option-${active}` : undefined}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(e.target.value.includes("[["));
          setActive(0);
        }}
        onKeyDown={(e) =>
          open &&
          handleSuggestionKey(e, {
            count: items.length,
            activeIndex: active,
            onActiveIndexChange: setActive,
            onSelect: () => {
              const item = items[active];
              if (item) setText(text.slice(0, text.lastIndexOf("[[")) + `[[${item.label}]]`);
              setOpen(false);
            },
            onClose: () => setOpen(false),
          })
        }
        className="w-72"
      />
      <SuggestionList
        id="story-suggestions"
        label="Entries"
        open={open}
        items={items}
        activeIndex={active}
        onActiveIndexChange={setActive}
        onSelect={(item) => {
          setText(text.slice(0, text.lastIndexOf("[[")) + `[[${item.label}]]`);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        anchor={() => field.current?.getBoundingClientRect()}
      />
    </div>
  );
};
