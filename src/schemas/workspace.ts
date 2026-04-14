import { JSONSchemaType } from "ajv";
import { WorkspaceCreation } from "@models/workspace.js";

/**
 * Validation schema for workspace creation.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `title`: non-empty string, max 100 characters.
 */
export const workspaceCreationSchema: JSONSchemaType<WorkspaceCreation> = {
  type: "object",
  properties: {
    title: { type: "string", maxLength: 100, minLength: 1 },
  },
  required: ["title"],
  additionalProperties: false,
};
