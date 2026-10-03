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
