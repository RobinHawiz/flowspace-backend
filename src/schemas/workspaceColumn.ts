import { JSONSchemaType } from "ajv";
import { WorkspaceColumnCreation } from "@models/workspaceColumn.js";

/**
 * Validation schema for workspace column creation.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `title`: non-empty string, max 200 characters.
 * - `workspaceColumnOrder`: non-negative integer.
 */
export const workspaceColumnCreationSchema: JSONSchemaType<WorkspaceColumnCreation> =
  {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 200, minLength: 1 },
      workspaceColumnOrder: { type: "integer", minimum: 0 },
    },
    required: ["title", "workspaceColumnOrder"],
  };
