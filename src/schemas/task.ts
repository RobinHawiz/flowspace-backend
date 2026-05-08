import { JSONSchemaType } from "ajv";
import {
  TaskCreation,
  TaskMoveUpdate,
  TaskOrderUpdate,
  TaskUpdate,
} from "@models/task.js";

/**
 * Validation schema for task creation.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `workspaceColumnId`: numeric string.
 * - `title`: non-empty string, max 200 characters.
 * - `description`: string or null.
 * - `priority`: one of low, medium, high.
 * - `deadline`: ISO date-time string or null.
 * - `taskOrder`: non-negative integer.
 */
export const taskCreationSchema: JSONSchemaType<TaskCreation> = {
  type: "object",
  properties: {
    workspaceColumnId: { type: "string", pattern: "^[0-9]+$" },
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
 * - `workspaceColumnId`: numeric string.
 * - `taskOrder`: non-negative integer.
 */
export const taskOrderUpdateSchema: JSONSchemaType<TaskOrderUpdate> = {
  type: "object",
  properties: {
    workspaceColumnId: { type: "string", pattern: "^[0-9]+$" },
    taskOrder: { type: "integer", minimum: 0 },
  },
  required: ["workspaceColumnId", "taskOrder"],
  additionalProperties: false,
};

/**
 * Validation schema for task updates.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `title`: non-empty string, max 200 characters.
 * - `description`: string or null.
 * - `priority`: one of low, medium, high.
 * - `deadline`: ISO date-time string or null.
 */
export const taskUpdateSchema: JSONSchemaType<TaskUpdate> = {
  type: "object",
  properties: {
    title: { type: "string", maxLength: 200, minLength: 1 },
    description: { type: "string", nullable: true },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    deadline: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
  },
  required: ["title", "priority"],
  additionalProperties: false,
};

export const taskMoveUpdateSchema: JSONSchemaType<TaskMoveUpdate> = {
  type: "object",
  properties: {
    workspaceColumnId: { type: "string", pattern: "^[0-9]+$" },
    newWorkspaceColumnId: { type: "string", pattern: "^[0-9]+$" },
    newTaskOrder: { type: "integer", minimum: 0 },
  },
  required: ["workspaceColumnId", "newWorkspaceColumnId", "newTaskOrder"],
  additionalProperties: false,
};
