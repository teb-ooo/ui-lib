import { ApiError } from "@teb-ooo/web";
import { CommandProvider, CommandTrigger, useRegisterCommands } from "./index";
import type { Command, CommandForm } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Palette form step",
  group: "Molecules",
  description:
    "A form inside the palette. A command that needs typed answers (an x-palette tag with prompt arguments, or any command returning { form }) walks the person through them in the palette's own input: one field per step (text and numbers typed, yes/no and lists chosen from rows, optional ones skipped with Enter), with the breadcrumb showing where they are, then a review that lists the answers, lets any be changed and submits. A server's field error takes the person back to that field; Backspace on an empty input goes back a step.",
  aliases: ["command form", "palette prompt", "cmdk form", "create from palette", "form step", "wizard", "prompt", "generated form", "steps"],
  source: "src/cmdk/palette-form.stories.tsx",
} satisfies StoryDefault;

const form: CommandForm = {
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

const commands: Command[] = [{ id: "story-create-rule", title: "Create a rule", group: "Rules", run: () => ({ form }) }];

function Register() {
  useRegisterCommands(commands, []);
  return null;
}

export const Steps = () => (
  <CommandProvider standalone>
    <Register />
    <CommandTrigger />
  </CommandProvider>
);
Steps.storyMeta = { description: "Open the palette, choose Create a rule and answer step by step. Press Enter with nothing typed on a required field to see the message; use the code \"taken\" to see a server's field error take you back to that field." } satisfies StoryMeta;
