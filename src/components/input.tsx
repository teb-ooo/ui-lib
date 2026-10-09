import { forwardRef, useRef } from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../lib/cn";
import { Adornment, focusInside, setBothRefs } from "./adornment";
import type { AdornmentProps } from "./adornment";

export interface InputProps extends Omit<BaseInput.Props, "className">, AdornmentProps {
  className?: string;
}

/**
 * Text input. Inside a `Field` it picks up the id, description and invalid state automatically. With a `startAdornment` or
 * `endAdornment` the border belongs to a box that holds the adornment and the input ("LO" before the number, "kHz" after).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, startAdornment, endAdornment, ...rest }, ref) {
  const inner = useRef<HTMLInputElement | null>(null);
  if (startAdornment === undefined && endAdornment === undefined) return <BaseInput ref={ref} className={cn("input", className)} {...rest} />;
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- the box only forwards a click on its decoration to the input inside it
    <div onMouseDown={focusInside(inner)} className={cn("input flex items-center gap-2 has-[[data-invalid]]:border-danger-line has-[:disabled]:opacity-50", className)}>
      {startAdornment !== undefined ? <Adornment>{startAdornment}</Adornment> : null}
      <BaseInput
        ref={(node) => setBothRefs(inner, ref, node as HTMLInputElement | null)}
        className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-inherit outline-none"
        {...rest}
      />
      {endAdornment !== undefined ? <Adornment>{endAdornment}</Adornment> : null}
    </div>
  );
});
