import { useState } from "react";
import { Markdown } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Markdown",
  group: "Molecules",
  description:
    "Renders markdown source in the Prose look: headings, lists, quotes, code, tables, task lists, strikethrough and links. Import from @teb-ooo/ui/markdown (needs the optional peers react-markdown and remark-gfm). Raw HTML is shown as text, never rendered; [[Title]] becomes a link when you give wikiLink.",
  aliases: ["md", "markdown render", "note body", "readme", "formatted text", "wiki links", "gfm"],
  source: "src/markdown/markdown.tsx",
} satisfies StoryDefault;

const source = `# Trip to Lisbon

Flights booked for the **14th**. See also [[Packing list]] and the [city guide](https://example.com).

## Days
- [x] Alfama and the castle
- [ ] Day trip to Sintra

### Budget
| Item | Cost |
|------|------|
| Flights | 220 |
| Hotel | 340 |

> Take the tram early; the queues start at ten.

\`\`\`
const tram = 28;
\`\`\`

<b>Raw html is shown as text</b>
`;

export const Notes = () => <Markdown wikiLink={(t) => `#${encodeURIComponent(t)}`}>{source}</Markdown>;
Notes.storyMeta = { description: "A note with a wiki link, a task list, a table, a quote and code; the raw HTML line stays text." } satisfies StoryMeta;

export const TickableTasks = () => {
  const [source, setSource] = useState("- [x] Book flights\n- [ ] Pack\n- [ ] Call the hotel\n");
  const toggle = (index: number, checked: boolean) => {
    let n = -1;
    setSource((s) => s.replace(/^(\s*[-*+] )\[( |x)\]/gm, (m, lead: string) => (++n === index ? `${lead}[${checked ? "x" : " "}]` : m)));
  };
  return <Markdown onToggleTask={toggle} images={false} data-testid="tasks">{source}</Markdown>;
};
TickableTasks.storyMeta = { description: "onToggleTask makes task items tickable (the app saves the changed source); images={false} leaves images out." } satisfies StoryMeta;
