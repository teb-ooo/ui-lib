import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ContainerWidth = "narrow" | "default" | "wide" | "full";

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  /**
   * Maximum width: narrow 40rem (reading, forms), default 64rem, wide 90rem (tables), full (no limit).
   * @default "default"
   */
  width?: ContainerWidth;
  className?: string;
}

const widths: Record<ContainerWidth, string> = {
  narrow: "max-w-[40rem]",
  default: "max-w-[64rem]",
  wide: "max-w-[90rem]",
  full: "max-w-none",
};

/** Centres page content at one of four widths with the page gutter on each side. */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ width = "default", className, ...rest }, ref) {
  return <div ref={ref} data-width={width} className={cn("mx-auto w-full px-4 md:px-6", widths[width], className)} {...rest} />;
});
