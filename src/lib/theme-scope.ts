import { useRef, useState } from "react";

/**
 * A popup is drawn in a portal at the end of `<body>`, outside any container that forces a theme (the gallery's light and dark examples do), so it would follow the operating system's scheme instead. This finds the
 * nearest such container of the trigger when the popup opens; pass `container` to the primitive's `Portal` so the popup
 * is drawn inside it and keeps its theme. Outside a forced theme `container` stays undefined and the portal is unchanged.
 */
export function useThemeContainer<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  const track = (open: boolean): void => {
    if (open) setContainer(ref.current?.closest<HTMLElement>("[data-theme]") ?? undefined);
  };
  return { ref, container, track };
}
