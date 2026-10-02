import { Pencil } from "lucide-react";
import { Button } from "./button";
import { Chip } from "./chip";
import { FieldGrid, FieldRow } from "./field-grid";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FieldGrid",
  group: "Molecules",
  description: "A record's fields as rows: a label rail on the left, the value on the right, stacked on a phone. A draft value reads muted; row actions show on hover and focus.",
  aliases: ["fields", "properties", "key value", "label rail", "definition list", "description list", "form grid", "inspector"],
  component: "FieldGrid",
  source: "src/components/field-grid.tsx",
} satisfies StoryDefault;

export const Default = () => (
  <FieldGrid label="Entry fields">
    <FieldRow label="Name">Mira Vance</FieldRow>
    <FieldRow label="Born">Third age, year 212</FieldRow>
    <FieldRow label="Affiliation">
      <Chip tone="link">House Orlen</Chip>
    </FieldRow>
  </FieldGrid>
);

export const DraftAndActions = () => (
  <FieldGrid label="Entry fields">
    <FieldRow label="Name">Mira Vance</FieldRow>
    <FieldRow label="Summary" draft actions={<Button icon={<Pencil aria-hidden="true" className="size-4" />} aria-label="Edit summary" className="border-transparent" />}>
      A courier who may have sold the map. Not confirmed.
    </FieldRow>
  </FieldGrid>
);
DraftAndActions.storyMeta = { description: "draft mutes the value; actions appear on hover or focus (always on touch)." } satisfies StoryMeta;
