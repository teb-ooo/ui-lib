/** Opens a URL in a new tab, isolated so tests can replace it. */
export function openInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
