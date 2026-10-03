import { useState } from "react";
import { Card, CardGrid } from "./card";
import { Chip } from "./chip";
import { DataTable } from "./data-table";
import { ToggleGroup } from "./toggle-group";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Card",
  group: "Molecules",
  description:
    "A tile summarising one thing (an app, a project, a person): title, a line, chips, a footer, a marker. The whole card is the one link or button. Put several in a CardGrid: as many columns as fit, one on a phone, arrow keys move between cards.",
  aliases: ["cards", "tile", "grid", "card grid", "app card", "gallery view", "cards view", "dashboard tiles", "project card"],
  component: "Card",
  source: "src/components/card.tsx",
} satisfies StoryDefault;

const apps = [
  { name: "ah", what: "The playground dashboard: apps, their agents, promotion, secrets, logs and the brains.", agent: "working", version: "v0.9.0", mode: "auto", seen: "2 minutes ago", needs: true },
  { name: "bd", what: "The work tracker over the existing beads: needs-you, ready work, detail, quick actions.", agent: "idle", version: "v0.9.0", mode: "auto", seen: "5 minutes ago", needs: false },
  { name: "id", what: "Sign in and profile for teb.ooo.", agent: "idle", version: "v0.5.0", mode: "manual", seen: "1 hour ago", needs: false },
  { name: "notes", what: "Stores markdown notes with tags and backlinks.", agent: "working", version: "v0.5.6", mode: "auto", seen: "3 minutes ago", needs: false },
  { name: "waves", what: "Group listening to radio spectrum, side by side with the original.", agent: "offline", version: "not live", mode: "auto", seen: "1 day ago", needs: true },
];

export const Grid = () => (
  <CardGrid label="Apps">
    {apps.map((a) => (
      <Card
        key={a.name}
        title={a.name}
        description={a.what}
        href={`#${a.name}`}
        marker={a.needs ? <Chip tone="warn">Needs you</Chip> : undefined}
        meta={
          <>
            <Chip tone={a.agent === "working" ? "agent" : a.agent === "offline" ? "warn" : "muted"}>{a.agent}</Chip>
            <Chip tone={a.version === "not live" ? "muted" : "ok"}>{a.version}</Chip>
            <Chip>{a.mode} promote</Chip>
          </>
        }
        footer={`active ${a.seen}`}
      />
    ))}
  </CardGrid>
);
Grid.storyMeta = { description: "Each card is one link. Resize: the columns follow the width and it is one column at 390px. Use the arrow keys to move between cards." } satisfies StoryMeta;

export const TableOrCards = () => {
  const [view, setView] = useState<string | null>("cards");
  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        label="View"
        required
        value={view}
        onValueChange={setView}
        options={[
          { value: "cards", label: "Cards" },
          { value: "table", label: "Table" },
        ]}
      />
      {view === "table" ? (
        <div className="h-80">
          <DataTable
            label="Apps"
            rows={apps}
            rowKey={(a) => a.name}
            columns={[
              { id: "name", header: "App", cell: (a) => a.name, width: "8rem" },
              { id: "what", header: "What it is for", cell: (a) => a.what },
              { id: "version", header: "Production", cell: (a) => a.version, width: "8rem" },
            ]}
          />
        </div>
      ) : (
        <CardGrid label="Apps">
          {apps.map((a) => (
            <Card key={a.name} title={a.name} description={a.what} href={`#${a.name}`} footer={a.version} />
          ))}
        </CardGrid>
      )}
    </div>
  );
};
TableOrCards.storyMeta = { description: "A table/cards switch is a ToggleGroup with `required` (choosing the chosen one again does nothing) and the same rows rendered two ways." } satisfies StoryMeta;
