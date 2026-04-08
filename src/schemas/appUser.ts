import { JSONSchemaType } from "ajv";
import { AppUserCredentials, AppUserRegistration } from "@models/appUser.js";

/**
 * Validation schema for user registration.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `firstName`: non-empty string, max 50 characters.
 * - `lastName`: non-empty string, max 50 characters.
 * - `email`: valid email address.
 * - `password`: non-empty string, min 8 characters, max 200 characters.
 */
export const appUserRegistrationSchema: JSONSchemaType<AppUserRegistration> = {
  type: "object",
  properties: {
    firstName: { type: "string", maxLength: 50, minLength: 1 },
    lastName: { type: "string", maxLength: 50, minLength: 1 },
    email: { type: "string", format: "email" },
    password: { type: "string", maxLength: 200, minLength: 8 },
  },
  required: ["firstName", "lastName", "email", "password"],
  additionalProperties: false,
};

/**
 * Validation schema for user login credentials.
 *
 * Validates the request body to ensure required fields are present and formatted correctly:
 * - `email`: valid email address.
 * - `password`: non-empty string, min 8 characters, max 200 characters.
 */
export const appUserCredentialsSchema: JSONSchemaType<AppUserCredentials> = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", maxLength: 200, minLength: 8 },
  },
  required: ["email", "password"],
  additionalProperties: false,
};
