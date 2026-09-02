import { defaultSchema } from "hast-util-sanitize";

export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    th: [...(defaultSchema.attributes?.th ?? []), ["align"]],
    td: [...(defaultSchema.attributes?.td ?? []), ["align"]],
    input: [["type"], ["disabled"], ["checked"]],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "del",
    "ins",
    "input",
  ],
};
