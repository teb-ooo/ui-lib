import { StatusMark } from "./status-mark";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "StatusMark",
  group: "Atoms",
  description:
    "A small state mark for a cell of a dense table or a matrix (a run against its checks): a check for ok, a cross for failed, an i for info, a dash for not run, in the state's colour. Each state has its own shape, so colour is never the only signal, and each mark has an accessible name (give it a label that names the thing: \"Backups: ok\"). Use it in DataTable columns of width 2.5rem with align center and rotate.",
  aliases: ["status icon", "check mark", "pass fail", "ok fail", "tick", "cross", "matrix cell", "state mark", "health"],
  component: "StatusMark",
  source: "src/components/status-mark.tsx",
} satisfies StoryDefault;

export const States = () => (
  <div className="flex items-center gap-4 text-ink">
    <span className="flex items-center gap-2"><StatusMark status="ok" label="Backups: ok" /> ok</span>
    <span className="flex items-center gap-2"><StatusMark status="fail" label="DNS: failed" /> failed</span>
    <span className="flex items-center gap-2"><StatusMark status="info" label="Disk space: info" /> info</span>
    <span className="flex items-center gap-2"><StatusMark status="none" label="Queue: not run" /> not run</span>
  </div>
);
States.storyMeta = { description: "The four states, each with its own shape and colour." } satisfies StoryMeta;
