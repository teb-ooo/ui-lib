/** Full-page navigations, isolated so tests can replace them (jsdom cannot navigate). */
export function assignLocation(url: string): void {
  window.location.assign(url);
}

export function openInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * `https://id.<domain>/profile`, where domain is the current host without its first label
 * (`hello-staging.teb.ooo` gives `teb.ooo`). `null` when the host has no such domain (localhost, IPs, bare domains).
 */
export function profileUrl(hostname: string = window.location.hostname): string | null {
  if (hostname === "" || /^[\d.]+$/u.test(hostname) || hostname.includes(":")) return null;
  const labels = hostname.split(".");
  if (labels.length < 3) return null;
  return `https://id.${labels.slice(1).join(".")}/profile`;
}
