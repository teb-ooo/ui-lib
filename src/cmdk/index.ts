import "./static-data";

export { CommandProvider } from "./provider";
export type { CommandProviderProps } from "./provider";
export { useRegisterCommands } from "./use-register-commands";
export { useCommandPalette } from "./use-command-palette";
export type { CommandPaletteApi } from "./context";
export { CommandTrigger } from "./command-trigger";
export type { CommandTriggerProps } from "./command-trigger";
export type { Command, CommandContext, CommandIcon, CommandIconProps, CommandResult } from "./types";
export { useFeedbackCommand } from "./feedback-command";
export type { FeedbackCommandSource } from "./feedback-command";
export { fuzzyMatch } from "./fuzzy";
// Exported so the gallery's static palette story can render the surface without a provider.
export { buildPaletteModel } from "./palette-model";
export type { PaletteModel, PaletteRow, PaletteSection, ModelInput } from "./palette-model";
export { PaletteView } from "./palette-view";
export type { PaletteViewProps } from "./palette-view";
export type { FuzzyMatch } from "./fuzzy";
