/** Tolerant, typed view of `window.__PLAYGROUND__` (snake_case from the Go side, camelCase also accepted). */
export interface PlaygroundInfo {
  appName: string;
  env: string;
  claudeSessionUrl: string;
}

function pick(raw: Record<string, unknown>, snake: string, camel: string): unknown {
  return raw[snake] ?? raw[camel];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Reads the global fresh on every call. Never throws; every field has a safe default. */
export function readPlayground(): PlaygroundInfo {
  const g: unknown = typeof window === "undefined" ? undefined : (window as unknown as { __PLAYGROUND__?: unknown }).__PLAYGROUND__;
  const raw: Record<string, unknown> = g !== null && typeof g === "object" ? (g as Record<string, unknown>) : {};
  return {
    appName: str(pick(raw, "app_name", "appName")),
    env: str(pick(raw, "env", "env")),
    claudeSessionUrl: str(pick(raw, "claude_session_url", "claudeSessionUrl")),
  };
}
