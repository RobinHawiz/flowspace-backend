import { JSONSchemaType } from "ajv";
import { TaskCreation, TaskOrderUpdate } from "@models/task.js";

/**
 * Validation schema for task creation.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `workspaceColumnId`: integer.
 * - `title`: non-empty string, max 200 characters.
 * - `description`: string or null.
 * - `priority`: one of low, medium, high.
 * - `deadline`: ISO date-time string or null.
 * - `taskOrder`: non-negative integer.
 */
export const taskCreationSchema: JSONSchemaType<TaskCreation> = {
  type: "object",
  properties: {
    workspaceColumnId: { type: "integer" },
    title: { type: "string", maxLength: 200, minLength: 1 },
    description: { type: "string", nullable: true },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    deadline: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
    taskOrder: { type: "integer", minimum: 0 },
  },
  required: ["workspaceColumnId", "title", "priority", "taskOrder"],
  additionalProperties: false,
};

/**
 * Validation schema for task order updates.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `workspaceColumnId`: integer.
 * - `taskOrder`: non-negative integer.
 */
export const taskOrderUpdateSchema: JSONSchemaType<TaskOrderUpdate> = {
  type: "object",
  properties: {
    workspaceColumnId: { type: "integer" },
    taskOrder: { type: "integer", minimum: 0 },
  },
  required: ["workspaceColumnId", "taskOrder"],
  additionalProperties: false,
};
