import { useState } from "react";
import { Chip } from "./chip";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Chip",
  group: "Atoms",
  description: "A static token: a status, a count or a reference. Colour is state only.",
  aliases: ["removable chip", "tag", "pill", "badge", "label", "status", "token", "lozenge"],
  component: "Chip",
  source: "src/components/chip.tsx",
} satisfies StoryDefault;

export const Default = () => <Chip>draft</Chip>;

export const Ok = () => <Chip tone="ok">healthy</Chip>;
Ok.storyMeta = { state: "default" } satisfies StoryMeta;

export const Warn = () => <Chip tone="warn">staging</Chip>;

export const Danger = () => <Chip tone="danger">failed</Chip>;
Danger.storyMeta = { state: "error" } satisfies StoryMeta;

export const Link = () => <Chip tone="link">reference</Chip>;

export const Agent = () => <Chip tone="agent">agent working</Chip>;

export const Muted = () => <Chip tone="muted">inactive</Chip>;

export const Removable = () => {
  const [on, setOn] = useState(true);
  return on ? (
    <Chip tone="link" onRemove={() => setOn(false)} removeLabel="Remove Mira">
      Mira
    </Chip>
  ) : (
    <span className="text-ink-faint">Removed</span>
  );
};
Removable.storyMeta = { description: "onRemove adds an X control after the label." } satisfies StoryMeta;

export const LockToggle = () => {
  const [locked, setLocked] = useState(false);
  return (
    <Chip tone={locked ? "ok" : "muted"} locked={locked} onLockedChange={setLocked} lockLabel="Mark canon" unlockLabel="Mark draft">
      {locked ? "canon" : "draft"}
    </Chip>
  );
};
LockToggle.storyMeta = { description: "locked and onLockedChange add a padlock toggle, for example draft to canon." } satisfies StoryMeta;
