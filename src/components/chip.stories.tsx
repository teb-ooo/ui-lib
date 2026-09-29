import { Chip } from "./chip";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Chip",
  group: "Atoms",
  description: "A static token: a status, a count or a reference. Colour is state only.",
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
