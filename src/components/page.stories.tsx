import { Button } from "./button";
import { DataTable } from "./data-table";
import { Page, PageBody, PageColumns } from "./page";
import { PageHeader, Section } from "./section";
import { SearchInput } from "./search-input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Page",
  group: "Molecules",
  description:
    "The frame of one screen inside the Shell: fixed bands above exactly one scroll surface. From lg the bands stay put and the PageBody scrolls (or holds the one table or split pane that fills it, with fill); below lg the Shell's content area scrolls the whole page. Never a scroller inside a scroller.",
  aliases: ["screen", "scroll area", "scroll surface", "page layout", "fixed header", "sticky header", "scrolling", "layout frame", "pane"],
  component: "Page",
  source: "src/components/page.tsx",
} satisfies StoryDefault;

const rows = Array.from({ length: 40 }, (_, i) => ({ id: String(i), name: `Row ${i + 1}` }));

export const TableScreen = () => (
  <div className="h-96 border border-line">
    <Page>
      <PageHeader size="compact" title="Rules" description="55 rules" actions={<Button intent="solid">New rule</Button>}>
        <SearchInput value="" onValueChange={() => undefined} label="Search" placeholder="Search" className="max-w-xs" />
      </PageHeader>
      <PageBody fill>
        <DataTable label="Rows" rows={rows} rowKey={(r) => r.id} columns={[{ id: "name", header: "Name", cell: (r) => r.name }]} bleed />
      </PageBody>
    </Page>
  </div>
);
TableScreen.storyMeta = { description: "A table screen: the compact header and the table's own header stay put, the table scrolls itself; the body has no scroller (fill)." } satisfies StoryMeta;

export const DocumentScreen = () => (
  <div className="h-96 border border-line">
    <Page>
      <PageHeader title="Profile" description="Your account." sticky />
      <Section title="Details" rule="none">
        <p className="text-ink-muted">The bands above stay put.</p>
      </Section>
      <PageBody>
        {rows.map((r) => (
          <p key={r.id} className="px-4 py-1 md:px-6">
            {r.name}
          </p>
        ))}
      </PageBody>
    </Page>
  </div>
);
DocumentScreen.storyMeta = { description: "A document screen: the body is the one scroll surface from lg; below lg the whole page scrolls." } satisfies StoryMeta;

export const TwoColumns = () => (
  <div className="h-96 border border-line">
    <Page>
      <PageHeader size="compact" title="ah" description="The dashboard" />
      <PageColumns firstWidth={16}>
        <PageBody gutter className="py-3">
          <p className="text-ink-muted">Details: its own scroll surface from lg.</p>
          {rows.slice(0, 20).map((r) => (
            <p key={r.id}>{r.name}</p>
          ))}
        </PageBody>
        <PageBody gutter className="py-3 max-lg:order-first">
          <p className="text-ink-muted">Tabs: the second surface; first on a phone.</p>
          {rows.map((r) => (
            <p key={r.id}>{r.name}</p>
          ))}
        </PageBody>
      </PageColumns>
    </Page>
  </div>
);
TwoColumns.storyMeta = { description: "Two scroll surfaces side by side from lg (details and tabs), one column of the page on a phone with the tabs first." } satisfies StoryMeta;
