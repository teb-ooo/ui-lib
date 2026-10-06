import { createContext, useContext } from "react";

/**
 * Where a popup is drawn. A popup (select, menu, popover, tooltip, dialog) is drawn in a portal at the end of `<body>`,
 * outside any container that forces a theme, so it would follow the operating system's scheme instead of the example it
 * belongs to. A container that forces a theme (the gallery's light and dark examples) provides itself here, and the popups
 * below it are drawn inside it and keep its theme. Without a provider the portal is unchanged.
 */
const PortalContainerContext = createContext<HTMLElement | undefined>(undefined);

/** Provide the element popups below should be drawn in; `null` (not mounted yet) is the same as none. */
export function PortalContainerProvider({ container, children }: { container: HTMLElement | null; children?: React.ReactNode }) {
  return <PortalContainerContext.Provider value={container ?? undefined}>{children}</PortalContainerContext.Provider>;
}

/** The container to pass to a primitive's `Portal`, or undefined. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext);
}
