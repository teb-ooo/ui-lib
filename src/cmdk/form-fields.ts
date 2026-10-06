// The fields a form step asks for, read from an operation's JSON request body schema in the OpenAPI document.
import type { OpenApiDocument } from "./from-spec";

type Schema = Record<string, unknown>;

/** How one field is drawn. */
export type PaletteFieldKind = "text" | "multiline" | "number" | "integer" | "boolean" | "select";

/** One question of a form step. */
export interface PaletteFormField {
  /** The body property. */
  name: string;
  /** The schema's `title`, else the property name as words ("content_hash" is "Content hash"). */
  label: string;
  /** The schema's `description`. */
  description?: string;
  kind: PaletteFieldKind;
  required: boolean;
  /** For `select`: the schema's `enum`. */
  options?: string[];
  /** The schema's `format` for a text field (`email` draws an email input). */
  format?: string;
}

export interface PromptFields {
  fields: PaletteFormField[];
  /** An object schema holding only these fields (and the document's `components`), for `createBodyValidator`. */
  schema: Schema;
}

const isRecord = (v: unknown): v is Schema => typeof v === "object" && v !== null && !Array.isArray(v);

function components(doc: OpenApiDocument): Schema {
  return isRecord(doc.components) ? doc.components : {};
}

function deref(doc: OpenApiDocument, schema: unknown): Schema | undefined {
  let cur = schema;
  for (let i = 0; i < 16 && isRecord(cur) && typeof cur.$ref === "string"; i++) {
    const ref = cur.$ref;
    if (!ref.startsWith("#/components/")) return undefined;
    let next: unknown = { components: components(doc) };
    for (const seg of ref.slice(2).split("/")) next = isRecord(next) ? next[seg] : undefined;
    cur = next;
  }
  return isRecord(cur) ? cur : undefined;
}

function humanize(name: string): string {
  const words = name.replace(/[_-]+/gu, " ").replace(/([a-z])([A-Z])/gu, "$1 $2").trim().toLowerCase();
  return words === "" ? name : words[0]!.toUpperCase() + words.slice(1);
}

/** The JSON request body schema of an operation, resolved to an object schema; or why there is none. */
function bodyOf(doc: OpenApiDocument, operationId: string): Schema | string {
  for (const item of Object.values(doc.paths ?? {})) {
    for (const op of Object.values(item ?? {})) {
      if (!isRecord(op) || op.operationId !== operationId) continue;
      const content = isRecord(op.requestBody) && isRecord(op.requestBody.content) ? op.requestBody.content : {};
      const media = Object.entries(content).find(([m]) => /^application\/(.+\+)?json/u.test(m));
      const body = media && isRecord(media[1]) ? deref(doc, media[1].schema) : undefined;
      if (!body) return "it has no JSON request body to ask for fields of";
      if (body.type !== "object" || !isRecord(body.properties)) return "its request body is not an object with properties";
      return body;
    }
  }
  return "it is not in the document";
}

function kindOf(schema: Schema): PaletteFieldKind | null {
  if (Array.isArray(schema.enum) && schema.enum.every((e) => typeof e === "string")) return "select";
  const types = (Array.isArray(schema.type) ? schema.type : [schema.type]).filter((t) => t !== "null");
  if (types.length !== 1) return null;
  switch (types[0]) {
    case "string":
      // A long free text is a box; a value with a format (an email, an address) or a modest limit is one line.
      return typeof schema.maxLength === "number" && schema.maxLength > 1000 && schema.format === undefined ? "multiline" : "text";
    case "integer":
      return "integer";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return null;
  }
}

/** The form fields for the named body properties, or the reason one cannot be asked for (a sentence for a test to print). */
export function promptFieldsOf(doc: OpenApiDocument, operationId: string, names: readonly string[]): PromptFields | string {
  const body = bodyOf(doc, operationId);
  if (typeof body === "string") return body;
  const props = body.properties as Schema;
  const required = Array.isArray(body.required) ? (body.required as unknown[]) : [];
  const fields: PaletteFormField[] = [];
  const picked: Schema = {};
  for (const name of names) {
    const prop = deref(doc, props[name]);
    if (!prop) return `"${name}" is not a property of its request body`;
    const kind = kindOf(prop);
    if (kind === null) return `"${name}" is not a single value (text, number, yes/no or one of a list), so it cannot be asked for in a form`;
    picked[name] = props[name];
    fields.push({
      name,
      label: typeof prop.title === "string" && prop.title !== "" ? prop.title : humanize(name),
      ...(typeof prop.description === "string" && prop.description !== "" ? { description: prop.description } : {}),
      kind,
      required: required.includes(name),
      ...(kind === "select" ? { options: prop.enum as string[] } : {}),
      ...(kind === "text" && typeof prop.format === "string" ? { format: prop.format } : {}),
    });
  }
  return { fields, schema: { type: "object", properties: picked, required: names.filter((n) => required.includes(n)), components: components(doc) } };
}
