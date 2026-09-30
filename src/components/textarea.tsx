import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import { cn } from "../lib/cn";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  /**
   * Visible lines when empty.
   * @default 3
   */
  rows?: number;
  className?: string;
}

/**
 * Multi-line text input. Like `Input` it takes its id, description and invalid state from an enclosing `Field`.
 * Not fixed to the control height; it resizes vertically only.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, rows = 3, ...rest }, ref) {
  return (
    <BaseField.Control
      render={<textarea ref={ref} rows={rows} {...rest} />}
      className={cn("input h-auto resize-y py-1", className)}
    />
  );
});
