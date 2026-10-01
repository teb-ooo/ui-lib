import { useState } from "react";
import { Switch } from "./switch";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Switch",
  group: "Atoms",
  description:
    "An on/off preference that takes effect immediately, such as a notification setting. The label is its accessible name; a description may sit under it. For choices that wait for a submit, use Checkbox.",
  aliases: ["toggle", "on off", "toggle switch", "setting", "preference", "slider switch"],
  component: "Switch",
  source: "src/components/switch.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [on, setOn] = useState(false);
  return <Switch label="Email me when a passkey is added" checked={on} onCheckedChange={setOn} />;
};
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const On = () => <Switch label="Email me when my email is changed" defaultChecked />;

export const WithDescription = () => <Switch label="Weekly summary" description="A short email every Monday with what changed." defaultChecked />;

export const Disabled = () => <Switch label="Managed by an administrator" defaultChecked disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
