import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  AppUserCredentials,
  AppUserResponse,
  AppUserRegistration,
  AppUserInsert,
} from "@models/appUser.js";
import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@errors/appError.js";
import { AppUserRepository } from "@repositories/appUser.js";

export interface AuthService {
  /**
   * Attempts to authenticate an app user.
   *
   * @throws UnauthorizedError if the email or password is incorrect.
   */
  loginUser(payload: AppUserCredentials): Promise<string>;
  /**
   * Retrieves the current authenticated app user.
   *
   * @throws NotFoundError if the user is not found.
   */
  getAppUser(id: string): Promise<AppUserResponse>;
  /**
   * Attempts to register a new app user.
   */
  insertAppUser(userPayload: AppUserRegistration): Promise<AppUserResponse>;
}

export class DefaultAuthService implements AuthService {
  constructor(private readonly appUserRepo: AppUserRepository) {}

  async loginUser(payload: AppUserCredentials) {
    const appUser = await this.appUserRepo.findByEmail(payload.email);
    if (!appUser) {
      throw new UnauthorizedError(`Email or password is incorrect`);
    }
    const passwordMatch = await bcrypt.compare(
      payload.password,
      appUser.passwordHash,
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
    const token: string = jwt.sign({ id: appUser.id }, key, {
      expiresIn: "1h",
    });
    return token;
  }

  async getAppUser(id: string) {
    const appUser = await this.appUserRepo.findOneAppUser(id);
    if (!appUser) {
      throw new NotFoundError(`App user not found`);
    }
    return appUser;
  }

  async insertAppUser(payload: AppUserRegistration) {
    const { firstName, lastName, email, password } = payload;
    const passwordHash = await bcrypt.hash(password, 10);

    const newAppUser: AppUserInsert = {
      firstName,
      lastName,
      email,
      passwordHash,
    };

    return this.appUserRepo.insertAppUser(newAppUser);
  }
}
