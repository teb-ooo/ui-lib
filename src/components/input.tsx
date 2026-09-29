import { forwardRef } from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../lib/cn";

export interface InputProps extends Omit<BaseInput.Props, "className"> {
  className?: string;
}

/** Text input. Inside a `Field` it picks up the id, description and invalid state automatically. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...rest }, ref) {
  return (
    <BaseInput
      ref={ref}
      className={cn(
        "h-(--control-h) w-full rounded-ctl border border-line bg-ground px-3 font-sans text-base text-ink",
        "placeholder:text-muted outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
        "data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
});
