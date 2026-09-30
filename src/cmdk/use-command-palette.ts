import { usePaletteApi } from "./context";
import type { CommandPaletteApi } from "./context";

/** `{ open, close, isOpen }` for buttons and code that control the palette. */
export function useCommandPalette(): CommandPaletteApi {
  return usePaletteApi();
}
