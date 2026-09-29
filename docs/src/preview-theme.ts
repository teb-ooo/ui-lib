import themeCss from "../../theme.css?raw";

/**
 * theme.css scopes its light and dark tokens to `:root`. The previews need them on a container, so the
 * same declaration blocks are re-scoped to `.preview[data-theme]` at runtime: no copy that can drift.
 */
export function scopedThemeCss(css: string): string {
  const light = /:root\s*\{([^}]*)\}/.exec(css)?.[1];
  const dark = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)?.[1];
  if (!light || !dark) throw new Error("theme.css: token blocks not found");
  return `.preview[data-theme="light"]{${light}}\n.preview[data-theme="dark"]{${dark}}`;
}

let installed = false;

export function installPreviewTheme(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  const style = document.createElement("style");
  style.setAttribute("data-preview-theme", "");
  style.textContent = scopedThemeCss(themeCss);
  document.head.appendChild(style);
}
