// Development-time warnings. They never fire in production builds or under jsdom (tests), unless a test forces them.
declare const process: { env?: Record<string, string | undefined> } | undefined;
const warned = new Set<string>();
let override: boolean | null = null;

/** Tests only: force the warnings on or off (null = automatic) and forget what was already warned. */
export function setDevWarnings(value: boolean | null): void {
  override = value;
  warned.clear();
}

function enabled(): boolean {
  if (override !== null) return override;
  const env = typeof process !== "undefined" ? process.env?.NODE_ENV : undefined;
  if (env === "production") return false;
  return !(typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent));
}

/** console.warn once per key, in development only. */
export function warnOnce(key: string, message: string): void {
  if (!enabled() || warned.has(key)) return;
  warned.add(key);
  console.warn(`[@teb-ooo/ui/cmdk] ${message}`);
}
