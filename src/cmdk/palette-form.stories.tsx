import { useState } from "react";
import { ApiError } from "@teb-ooo/web";
import { Button } from "@teb-ooo/ui";
import { PaletteFormDialog } from "./index";
import type { PaletteFormRequest } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Palette form step",
  group: "Molecules",
  description:
    "The dialog a generated Cmd+K command opens when its x-palette tag marks arguments as prompt: one field per argument, built from the operation's request body schema (text, number, yes/no, one of a list) and validated by it, the server's field errors under their fields, any other failure in a sentence above the buttons. PaletteFromApi renders it by itself; this entry shows it with a stand-in request that sends nothing.",
  aliases: ["command form", "palette prompt", "cmdk form", "create from palette", "form step", "prompt dialog", "generated form"],
  component: "PaletteFormDialog",
  source: "src/cmdk/palette-form.tsx",
} satisfies StoryDefault;

const request: PaletteFormRequest = {
  title: "Create a rule",
  submitLabel: "Create rule",
  fields: [
    { name: "code", label: "Code", description: "Short and stable: three or more characters. \"taken\" is refused by the stand-in server.", kind: "text", required: true },
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "kind", label: "Kind", kind: "select", required: true, options: ["must", "should"] },
    { name: "weight", label: "Weight", kind: "integer", required: false },
    { name: "strict", label: "Strict", kind: "boolean", required: false },
  ],
  schema: {
    type: "object",
    required: ["code", "title", "kind"],
    properties: {
      code: { type: "string", minLength: 3 },
      title: { type: "string", minLength: 1 },
      kind: { type: "string", enum: ["must", "should"] },
      weight: { type: "integer", minimum: 1 },
      strict: { type: "boolean" },
    },
  },
  submit: async (values) => {
    await new Promise((r) => setTimeout(r, 400));
    if (values.code === "taken") throw new ApiError({ status: 422, title: "Unprocessable", errors: [{ location: "body.code", message: "code already exists" }] });
  },
};

export const Form = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the form</Button>
      {open ? <PaletteFormDialog request={request} onClose={() => setOpen(false)} /> : null}
    </>
  );
};
Form.storyMeta = { description: "Press Create with nothing filled in to see the required messages; use the code \"taken\" to see a server's field error stay under its field." } satisfies StoryMeta;
