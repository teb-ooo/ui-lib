import { isValidElement } from "react";
import type { ComponentType, ReactNode } from "react";

/** An icon given either as an element (`<Check />`) or as a component (`Check`): both are accepted wherever a component takes `icon`. */
export type IconProp = ReactNode | ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/** Renders an `IconProp` at `className` size; elements are used as they are. */
export function renderIconProp(icon: IconProp, className = "size-4"): ReactNode {
  if (icon === undefined || icon === null || icon === false || icon === true) return null;
  if (isValidElement(icon) || typeof icon === "string" || typeof icon === "number") return icon;
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
    const Icon = icon as ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
    return <Icon aria-hidden="true" className={className} />;
  }
  return null;
}
