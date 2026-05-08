// Full app user entry used by the application.
export type AppUserEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

// Incoming payload for app user registration.
export type AppUserRegistration = Pick<
  AppUserEntity,
  "firstName" | "lastName" | "email"
> & {
  password: string;
};

// App user data shaped for database insertion.
export type AppUserInsert = Pick<
  AppUserEntity,
  "firstName" | "lastName" | "email"
> & {
  passwordHash: string;
};

// Incoming payload for app user login.
export type AppUserCredentials = Pick<AppUserEntity, "email"> & {
  password: string;
};

// Safe app user data returned in responses.
export type AppUserResponse = Pick<
  AppUserEntity,
  "id" | "firstName" | "lastName" | "email"
>;
