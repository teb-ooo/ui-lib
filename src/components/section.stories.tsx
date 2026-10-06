import { Button } from "./button";
import { Chip } from "./chip";
import { PageHeader, Section } from "./section";
import { SearchInput } from "./search-input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Section",
  group: "Molecules",
  description:
    "Page bands with full-width rules: PageHeader (title, a sentence, main actions) and Section (a titled band). The rule runs edge to edge of the content area; the content is inset by the page gutter. Stack them to make a page whose lines separate its parts.",
  aliases: ["page header", "page layout", "divider", "rule", "separator", "band", "toolbar band", "page frame", "bounded"],
  component: "Section",
  source: "src/components/section.tsx",
} satisfies StoryDefault;

export const PageOfBands = () => (
  <div className="border-y border-line">
    <PageHeader title="Apps" description="Every app on the playground and its state." actions={<Button intent="solid">New app</Button>} />
    <Section rule="bottom">
      <SearchInput value="" onValueChange={() => undefined} label="Search apps" placeholder="Search apps" />
    </Section>
    <Section title="Needs you" description="Things only you can decide." actions={<Chip tone="warning">2</Chip>}>
      <p className="text-ink-muted">A band can hold anything: a list, a table, a form.</p>
    </Section>
    <Section title="All apps" rule="none">
      <p className="text-ink-muted">The last band has no rule below it.</p>
    </Section>
  </div>
);
PageOfBands.storyMeta = { description: "Rules run full width between the bands; text and controls sit inside the gutter." } satisfies StoryMeta;
