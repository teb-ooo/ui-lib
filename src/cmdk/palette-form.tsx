import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea } from "@teb-ooo/ui";
import { createBodyValidator, describeError, isApiError, useForm } from "@teb-ooo/web";
import type { PaletteFormField } from "./form-fields";
import type { PaletteFormRequest } from "./from-spec";

export interface PaletteFormDialogProps {
  request: PaletteFormRequest;
  /** Called once when the form closes: after a successful submit, or when the person cancels. */
  onClose: () => void;
}

type Answers = Record<string, string | number | boolean | undefined>;

function control(f: PaletteFormField, answers: Answers, set: (name: string, value: string | number | boolean | undefined) => void, blur: () => void): ReactElement {
  const value = answers[f.name];
  switch (f.kind) {
    case "boolean":
      return <Checkbox aria-label={f.label} checked={value === true} onCheckedChange={(c) => set(f.name, c)} />;
    case "select":
      return <Select label={f.label} options={(f.options ?? []).map((o) => ({ value: o, label: o }))} value={typeof value === "string" ? value : null} onValueChange={(v) => set(f.name, v ?? undefined)} className="w-full" />;
    case "multiline":
      return <Textarea value={typeof value === "string" ? value : ""} onChange={(e) => set(f.name, e.target.value === "" ? undefined : e.target.value)} onBlur={blur} />;
    case "number":
    case "integer":
      return (
        <Input
          type="number"
          inputMode={f.kind === "integer" ? "numeric" : "decimal"}
          step={f.kind === "integer" ? 1 : "any"}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(e) => set(f.name, e.target.value === "" || Number.isNaN(Number(e.target.value)) ? undefined : Number(e.target.value))}
          onBlur={blur}
        />
      );
    default:
      return <Input value={typeof value === "string" ? value : ""} onChange={(e) => set(f.name, e.target.value === "" ? undefined : e.target.value)} onBlur={blur} />;
  }
}

/**
 * The form step of a generated command: a dialog with one field per `"prompt"` argument, built from the operation's
 * request body schema and validated by it (`createBodyValidator`, so it refuses what the API would). The server's field
 * errors land under their fields, any other failure above the buttons; the form stays open until the action succeeds.
 */
export function PaletteFormDialog({ request, onClose }: PaletteFormDialogProps): ReactElement {
  const formId = useId();
  const validator = useMemo(() => createBodyValidator<Answers>(request.schema), [request.schema]);
  const [failure, setFailure] = useState<string | null>(null);
  const defaults = useMemo(() => Object.fromEntries(request.fields.filter((f) => f.kind === "boolean").map((f) => [f.name, false])) as Answers, [request.fields]);
  const form = useForm<Answers>(validator, {
    defaultValues: defaults,
    onSubmit: async (values) => {
      setFailure(null);
      try {
        await request.submit(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean>);
        onClose();
      } catch (e) {
        if (isApiError(e)) throw e;
        setFailure(describeError(e));
      }
    },
  });
  const message = form.submitError ?? failure;
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !form.isSubmitting) onClose();
      }}
      title={request.title}
      footer={
        <>
          <Button disabled={form.isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} intent="solid" loading={form.isSubmitting}>
            {request.submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-3 p-3">
        {request.fields.map((f) => {
          const binding = form.field<string | number | boolean | undefined>(f.name);
          return (
            <Field key={f.name} label={f.required ? f.label : `${f.label} (optional)`} error={binding.error} {...(f.description ? { description: f.description } : {})}>
              {control(f, form.values, form.setValue, binding.onBlur)}
            </Field>
          );
        })}
        {message ? (
          <p role="alert" className="text-danger">
            {message}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
