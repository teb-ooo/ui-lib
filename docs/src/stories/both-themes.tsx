import type { ReactNode } from "react";

/**
 * Gallery-only: renders its children twice, side by side, inside containers that force the dark and the
 * light token sets, so both grounds are visible at once whatever the page theme is. A candidate for the
 * ui package only if a second consumer appears.
 */
export function BothThemes({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
      {(["dark", "light"] as const).map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          aria-label={`${theme} theme`}
          className="flex flex-col gap-3 rounded border border-line p-4"
        >
          <p className="m-0 text-ink-muted uppercase">{theme}</p>
          {children}
        </section>
      ))}
    </div>
  );
}
