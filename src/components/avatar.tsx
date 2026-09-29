import { forwardRef } from "react";
import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends Omit<BaseAvatar.Root.Props, "className" | "children"> {
  /** Image URL. When missing or failing to load, initials from `name` are shown. */
  src?: string;
  /** The person's name or username: source of the initials and the accessible name. */
  name: string;
  /**
   * Edge length: sm 1.5rem, md 2rem, lg 3rem.
   * @default "md"
   */
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  sm: "size-6 text-sm",
  md: "size-8 text-base",
  lg: "size-12 text-lg",
};

/** Up to two initials: first letters of the first two words, or the first two letters of a single word. */
export function initialsOf(name: string): string {
  const [a, b] = name.trim().split(/[\s_.-]+/u).filter(Boolean);
  if (!a) return "?";
  const first = Array.from(a);
  if (!b) return first.slice(0, 2).join("").toUpperCase();
  return `${first[0] ?? ""}${Array.from(b)[0] ?? ""}`.toUpperCase();
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, size = "md", className, ...rest },
  ref,
) {
  return (
    <BaseAvatar.Root
      ref={ref}
      role="img"
      aria-label={name}
      data-size={size}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-ctl border border-line bg-surface font-sans text-muted",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {src ? <BaseAvatar.Image src={src} alt="" className="size-full object-cover" /> : null}
      <BaseAvatar.Fallback aria-hidden="true">{initialsOf(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
});
