import { forwardRef, useImperativeHandle, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import type { ButtonIntent } from "./button";
import { Input } from "./input";

export interface FilePickerHandle {
  /** Opens the file chooser, for a command (Cmd+K) that picks a file without the button. */
  open: () => void;
}

export interface FilePickerProps {
  /** Called with the chosen files. The chooser resets afterwards, so the same file can be chosen twice. */
  onFiles: (files: File[]) => void;
  /** Accepted types, as for a file input: `image/*`, `.pdf`. */
  accept?: string;
  /** @default false */
  multiple?: boolean;
  /** The button label; it is the accessible name. */
  children: ReactNode;
  icon?: ReactNode;
  /** @default "default" */
  intent?: ButtonIntent;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A button that opens the file chooser. Hold a ref to call `open()` from elsewhere. */
export const FilePicker = forwardRef<FilePickerHandle, FilePickerProps>(function FilePicker(
  { onFiles, accept, multiple = false, children, icon, intent, loading, disabled, className },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ open: () => input.current?.click() }), []);
  return (
    <>
      <Button {...(intent ? { intent } : {})} {...(icon ? { icon } : {})} {...(className ? { className } : {})} loading={loading ?? false} disabled={disabled ?? false} onClick={() => input.current?.click()}>
        {children}
      </Button>
      <Input
        ref={input}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        {...(accept ? { accept } : {})}
        multiple={multiple}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </>
  );
});
