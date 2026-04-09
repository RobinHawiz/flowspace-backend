import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  AppUserCredentials,
  AppUserResponse,
  AppUserRegistration,
  AppUserInsert,
} from "@models/appUser.js";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@errors/appError.js";
import { AppUserRepository } from "@repositories/appUser.js";
import { AuthTokenResponse } from "@models/auth.js";

export interface AuthService {
  /**
   * Attempts to authenticate an app user.
   *
   * @throws UnauthorizedError if the email or password is incorrect.
   */
  loginUser(payload: AppUserCredentials): Promise<AuthTokenResponse>;
  /**
   * Retrieves the current authenticated app user.
   *
   * @throws NotFoundError if the user is not found.
   */
  getAppUser(id: number): Promise<AppUserResponse>;
  /**
   * Attempts to register a new app user.
   *
   * @throws ConflictError if a user with the same email already exists.
   */
  insertAppUser(userPayload: AppUserRegistration): Promise<AppUserResponse>;
}

export class DefaultAuthService implements AuthService {
  constructor(private readonly appUserRepo: AppUserRepository) {}

  async loginUser(payload: AppUserCredentials) {
    const user = await this.appUserRepo.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedError(`Email or password is incorrect`);
    }
    const passwordMatch = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedError(`Email or password is incorrect`);
    }

    const key = process.env.JWT_SECRET_KEY;
    if (!key) {
      throw new InternalServerError(
        "Missing JWT_SECRET_KEY environment variable.",
      );
    }
    // Create JWT
    const token: string = jwt.sign({ id: user.id }, key, {
      expiresIn: "1h",
    });
    return { token };
  }

  async getAppUser(id: number) {
    const appUser = await this.appUserRepo.findOneAppUser(id);
    if (!appUser) {
      throw new NotFoundError(`App user not found`);
    }
    return appUser;
  }

  async insertAppUser(payload: AppUserRegistration) {
    const user = await this.appUserRepo.findByEmail(payload.email);
    if (user) {
      throw new ConflictError(`App user already exists`);
    }

    const { firstName, lastName, email, password } = payload;
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: AppUserInsert = {
      firstName,
      lastName,
      email,
      passwordHash,
    };

    return this.appUserRepo.insertAppUser(newUser);
  }
}
