import { Container } from "./container";
import type { ContainerWidth } from "./container";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Container",
  group: "Molecules",
  description: "Page-width variants: narrow for reading and forms, default for most pages, wide for tables, full for edge to edge. The gutter is fixed.",
  component: "Container",
  source: "src/components/container.tsx",
} satisfies StoryDefault;

function Sample({ width }: { width: ContainerWidth }) {
  return (
    <Container width={width} className="px-0 md:px-0">
      <div className="panel p-3 text-ink-muted">Container, width {width}</div>
    </Container>
  );
}

export const Narrow = () => <Sample width="narrow" />;
Narrow.storyMeta = { description: "40rem." } satisfies StoryMeta;

export const Default = () => <Sample width="default" />;
Default.storyMeta = { description: "64rem." } satisfies StoryMeta;

export const Wide = () => <Sample width="wide" />;
Wide.storyMeta = { description: "90rem." } satisfies StoryMeta;

export const Full = () => <Sample width="full" />;
Full.storyMeta = { description: "No maximum." } satisfies StoryMeta;
