import type { ComponentType } from "react";

/** Sidebar category of a story module. */
export type StoryGroup = "Foundations" | "Atoms" | "Molecules" | "Email";

/** Default export of every `*.stories.tsx`: describes the entry. */
export interface StoryDefault {
  /** Entry name shown in the sidebar and search, e.g. "Button". */
  title: string;
  group: StoryGroup;
  /** One or two sentences of usage notes. */
  description: string;
  /** Exported component name (from `src/index.ts`) whose props table the gallery generates. */
  component?: string;
  /** Path of the component source relative to the package root, for the props table script. */
  source?: string;
}

export type StoryState = "default" | "hover" | "focus" | "disabled" | "loading" | "error";

/** Optional `Variant.storyMeta = {...}` on a named export. */
export interface StoryMeta {
  description?: string;
  state?: StoryState;
  /** Backdrop the variant renders on. Defaults to "neutral". */
  background?: "neutral" | "surface";
}

/** A variant: a zero-argument component, optionally carrying `storyMeta`. */
export type Story = ComponentType<Record<string, never>> & { storyMeta?: StoryMeta };
