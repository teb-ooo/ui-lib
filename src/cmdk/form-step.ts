import { useEffect, useMemo, useRef, useState } from "react";
import { createBodyValidator, describeError, friendlyMessage, isApiError } from "@teb-ooo/web";
import type { PaletteFormField } from "./form-fields";
import { buildPaletteModel } from "./palette-model";
import type { PaletteModel, PaletteRow } from "./palette-model";
import type { Command, CommandForm } from "./types";

type Answer = string | number | boolean | undefined;
type Choice = { value: string; label: string };
type Kind = "text" | "number" | "list" | "loading";

const EMPTY: PaletteModel = { sections: [], rows: [] };
const YES_NO: Choice[] = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

/** What the palette needs to draw and drive the current step of a form. */
export interface FormStep {
  model: PaletteModel;
  placeholder: string;
  /** The input's accessible name: the field's label. */
  inputLabel: string;
  /** A quiet line under the input: where you are, the field's help text. */
  note: string;
  /** The last crumb of the breadcrumb: "Code (1/6)" or "Review". */
  stepLabel: string;
  /** Typing is the answer and Enter commits it (text and number fields); otherwise a row is chosen. */
  typing: boolean;
  error: { title: string; message: string; plain: true } | null;
  pendingId: string | null;
  /** Choose a row: an option, Skip, an answer to edit, or the submit row. */
  select: (row: PaletteRow) => void;
  /** Commit what was typed in a text or number step. */
  enter: (typed: string) => void;
  /** Forget the message of the last attempt (the person started typing again). */
  clearError: () => void;
  /** One step back; false at the first step, where the caller leaves the form. */
  back: () => boolean;
}

function kindOf(f: PaletteFormField, loaded: Record<string, Choice[] | null>, remote: boolean): Kind {
  if (remote) {
    const l = loaded[f.name];
    if (l === undefined) return "loading";
    if (l !== null) return "list";
  }
  if (f.kind === "boolean" || f.kind === "select") return "list";
  return f.kind === "number" || f.kind === "integer" ? "number" : "text";
}

function choicesOf(f: PaletteFormField, loaded: Record<string, Choice[] | null>): Choice[] {
  const l = loaded[f.name];
  if (l) return l;
  if (f.kind === "boolean") return YES_NO;
  return (f.options ?? []).map((o) => ({ value: o, label: o }));
}

function shown(f: PaletteFormField, v: Answer, loaded: Record<string, Choice[] | null>): string {
  if (v === undefined) return "skipped";
  if (f.kind === "boolean") return v === true ? "Yes" : "No";
  return loaded[f.name]?.find((c) => c.value === v)?.label ?? String(v);
}

/**
 * The state machine of a form step inside the palette: one field per step answered in the palette's own input (or by
 * choosing a row for a yes/no, a list or a set of options), then a review that lists the answers, lets any be
 * changed, and submits. `null` while the palette is not in a form.
 */
export function useFormStep(form: CommandForm | undefined, query: string, setQuery: (q: string) => void, onDone: () => void): FormStep | null {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, Choice[] | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toReview = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const validator = useMemo(() => (form ? createBodyValidator(form.schema) : null), [form]);

  useEffect(() => {
    setAnswers({});
    setIndex(0);
    setLoaded({});
    setError(null);
    toReview.current = false;
    if (!form) return;
    setQuery("");
    for (const [name, load] of Object.entries(form.loadOptions ?? {})) {
      load().then(
        (choices) => alive.current && setLoaded((prev) => ({ ...prev, [name]: choices })),
        () => alive.current && setLoaded((prev) => ({ ...prev, [name]: null })),
      );
    }
    // The query setter is the palette's own and does not change; the form object does.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [form]);

  if (!form || !validator) return null;
  const fields = form.fields;
  const n = fields.length;
  const review = index >= n;
  const field = review ? undefined : fields[index];
  const kind: Kind | "review" = field ? kindOf(field, loaded, form.loadOptions?.[field.name] !== undefined) : "review";

  const goTo = (i: number, from: Record<string, Answer> = answers): void => {
    setIndex(i);
    setError(null);
    const f = fields[i];
    const k = f ? kindOf(f, loaded, form.loadOptions?.[f.name] !== undefined) : "review";
    setQuery(f && (k === "text" || k === "number") && from[f.name] !== undefined ? String(from[f.name]) : "");
  };
  const advance = (from: Record<string, Answer>): void => {
    if (toReview.current) {
      toReview.current = false;
      goTo(n, from);
    } else goTo(Math.min(index + 1, n), from);
  };
  const record = (name: string, v: Answer): Record<string, Answer> => {
    const next = { ...answers };
    if (v === undefined) delete next[name];
    else next[name] = v;
    setAnswers(next);
    return next;
  };

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      await form.submit(Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean>);
      if (alive.current) onDone();
    } catch (e) {
      if (!alive.current) return;
      if (isApiError(e)) {
        const hit = fields.findIndex((f) => e.fieldErrors[`body.${f.name}`] !== undefined);
        if (hit >= 0) {
          goTo(hit);
          setError(friendlyMessage(e.fieldErrors[`body.${fields[hit]!.name}`]!));
          return;
        }
      }
      setError(describeError(e));
    } finally {
      if (alive.current) setSubmitting(false);
    }
  };

  const commands = ((): Command[] => {
    const noop = (): void => undefined;
    if (field && kind === "list") {
      const group = field.label;
      return [...(field.required ? [] : [{ id: "skip", title: "Skip", group, run: noop }]), ...choicesOf(field, loaded).map((c) => ({ id: `choice:${c.value}`, title: c.label, group, run: noop }))];
    }
    if (kind === "review") {
      return [
        { id: "submit", title: form.submitLabel, group: "Submit", run: noop },
        ...fields.map((f) => ({ id: `edit:${f.name}`, title: `${f.label}: ${shown(f, answers[f.name], loaded)}`, group: "Review", hint: "Change", run: noop })),
      ];
    }
    return [];
  })();
  const model = commands.length > 0 ? buildPaletteModel({ query, commands, recents: [], root: false }) : EMPTY;

  const where = field ? `${field.label} · ${index + 1} of ${n}` : "Review";
  const help = field?.description ? ` · ${field.description}` : "";
  const note =
    kind === "review"
      ? `${where} · Enter ${form.submitLabel.toLowerCase()}, or pick an answer to change it`
      : kind === "loading"
        ? `${where} · Loading...`
        : kind === "list"
          ? `${where}${help}`
          : `${where}${help}${field && !field.required ? " · optional: Enter on nothing skips" : ""}`;

  return {
    model,
    placeholder: field ? (kind === "list" ? `Choose ${field.label.toLowerCase()}` : `${field.label}${field.required ? "" : " (optional)"}`) : "Type to filter",
    inputLabel: field ? field.label : "Review",
    note,
    stepLabel: field ? `${field.label} (${index + 1}/${n})` : "Review",
    typing: kind === "text" || kind === "number",
    error: error === null ? null : { title: form.title, message: error, plain: true },
    pendingId: submitting ? "submit" : null,
    select: (row) => {
      if (submitting) return;
      const id = row.command.id;
      if (id === "submit") void submit();
      else if (id.startsWith("edit:")) {
        const at = fields.findIndex((f) => f.name === id.slice(5));
        if (at >= 0) {
          toReview.current = true;
          goTo(at);
        }
      } else if (field && id === "skip") advance(record(field.name, undefined));
      else if (field && id.startsWith("choice:")) {
        const raw = id.slice(7);
        advance(record(field.name, field.kind === "boolean" ? raw === "true" : raw));
      }
    },
    enter: (typed) => {
      if (!field || submitting || (kind !== "text" && kind !== "number")) return;
      const raw = typed.trim();
      if (raw === "") {
        if (field.required) setError("Required.");
        else advance(record(field.name, undefined));
        return;
      }
      const value = kind === "number" ? Number(raw) : raw;
      if (typeof value === "number" && Number.isNaN(value)) {
        setError("Enter a number.");
        return;
      }
      const problem = validator.validate({ ...answers, [field.name]: value })[`body.${field.name}`];
      if (problem !== undefined) {
        setError(friendlyMessage(problem));
        return;
      }
      advance(record(field.name, value));
    },
    clearError: () => setError(null),
    back: () => {
      if (index === 0) return false;
      if (!submitting) {
        toReview.current = false;
        goTo(index - 1);
      }
      return true;
    },
  };
}
