import { CommandProvider, CommandTrigger, useCommandSource } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Command source",
  group: "Molecules",
  description:
    "Lets the Cmd+K palette search an app's own list or search API while someone types: results appear under their own group, each a command (usually 'open this entry'). useCommandSource({ id, group, search(query, signal), minChars?, debounceMs?, limit? }). The palette debounces, aborts the earlier request, keeps the old results until the new arrive, and shows Searching or a failure line without ever breaking.",
  aliases: ["search provider", "async commands", "dynamic commands", "api search", "jump to", "quick open", "omnibox", "global search"],
} satisfies StoryDefault;

const ENTRIES = ["Mother Meridian", "The Saltmere Coast", "Captain Ilsa Marr", "Harbour of Reeds", "The Drowned Bell"];

function EntrySource() {
  useCommandSource({
    id: "story-entries",
    group: "Entries",
    // A stand-in for the app's search operation.
    search: async (query, signal) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (signal.aborted) return [];
      return ENTRIES.filter((e) => e.toLowerCase().includes(query.toLowerCase())).map((e) => ({
        id: `story-entry:${e}`,
        title: e,
        group: "Entries",
        run: () => undefined,
      }));
    },
  });
  return null;
}

export const SearchingEntries = () => (
  <CommandProvider standalone>
    <EntrySource />
    <CommandTrigger />
  </CommandProvider>
);
SearchingEntries.storyMeta = { description: "Open the palette and type 'mer' or 'coast': the entries come from a (simulated, 250 ms) search request." } satisfies StoryMeta;
