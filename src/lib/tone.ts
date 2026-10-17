/** The state tones a control can take on (colour is state): the same ones chips and status marks use. */
export type ControlTone = "ok" | "warning" | "danger" | "link" | "agent";

/** The classes of a toggled-on option in a tone: its soft fill, its line and its text. Static strings, so Tailwind sees them. */
export const TONE_ACTIVE: Record<ControlTone, string> = {
  ok: "data-[active]:border-ok-line data-[active]:bg-ok-soft data-[active]:text-ok",
  warning: "data-[active]:border-warning-line data-[active]:bg-warning-soft data-[active]:text-warning",
  danger: "data-[active]:border-danger-line data-[active]:bg-danger-soft data-[active]:text-danger",
  link: "data-[active]:border-link-line data-[active]:bg-link-soft data-[active]:text-link",
  agent: "data-[active]:border-agent-line data-[active]:bg-agent-soft data-[active]:text-agent",
};

/** The text colour of a value in a tone. */
export const TONE_TEXT: Record<ControlTone, string> = { ok: "text-ok", warning: "text-warning", danger: "text-danger", link: "text-link", agent: "text-agent" };
