import { forwardRef } from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../lib/cn";

export interface InputProps extends Omit<BaseInput.Props, "className"> {
  className?: string;
}

/** Text input. Inside a `Field` it picks up the id, description and invalid state automatically. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...rest }, ref) {
  return <BaseInput ref={ref} className={cn("input", className)} {...rest} />;
});
