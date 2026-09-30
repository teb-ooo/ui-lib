import { createContext, useContext } from "react";

export interface ShellContextValue {
  /** True while the sidebar is drawn inside the phone drawer. */
  inDrawer: boolean;
  closeDrawer: () => void;
}

export const ShellContext = createContext<ShellContextValue>({ inDrawer: false, closeDrawer: () => undefined });

export function useShell(): ShellContextValue {
  return useContext(ShellContext);
}
