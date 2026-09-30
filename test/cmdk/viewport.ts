let width = 1024;

/** Sets the width the matchMedia mock reports (default 1024). */
export function setViewportWidth(px: number): void {
  width = px;
}

export function getViewportWidth(): number {
  return width;
}

export function resetViewport(): void {
  width = 1024;
}
