import { useState } from "react";
import { Upload } from "lucide-react";
import { FilePicker } from "./file-picker";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FilePicker",
  group: "Atoms",
  description: "A button that opens the file chooser, for uploads. It resets afterwards so the same file can be chosen twice, and a ref's open() lets a Cmd+K command open it too.",
  component: "FilePicker",
  source: "src/components/file-picker.tsx",
} satisfies StoryDefault;

function Demo({ multiple }: { multiple?: boolean }) {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilePicker multiple={multiple ?? false} accept="image/*" icon={<Upload aria-hidden="true" className="size-4" />} onFiles={(files) => setNames(files.map((f) => f.name))}>
        {multiple ? "Choose images" : "Choose image"}
      </FilePicker>
      <span className="text-ink-muted">{names.length > 0 ? names.join(", ") : "No file chosen"}</span>
    </div>
  );
}

export const Default = () => <Demo />;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const Multiple = () => <Demo multiple />;

export const Loading = () => (
  <FilePicker loading intent="solid" onFiles={() => undefined}>
    Uploading
  </FilePicker>
);
Loading.storyMeta = { state: "loading" } satisfies StoryMeta;

export const Disabled = () => (
  <FilePicker disabled onFiles={() => undefined}>
    Choose file
  </FilePicker>
);
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
