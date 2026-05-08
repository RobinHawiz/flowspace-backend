import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { ConflictError, InternalServerError } from "@errors/appError.js";
import {
  AppUserInsert,
  AppUserEntity,
  AppUserResponse,
} from "@models/appUser.js";

export interface AppUserRepository {
  /**
   * Verifies a users existence. Returns a user for password verification.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findByEmail(email: string): Promise<AppUserEntity | undefined>;
  /**
   * Returns one app user.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findOneAppUser(id: string): Promise<AppUserResponse | undefined>;
  /**
   * Inserts a user and returns the inserted user.
   *
   * @throws ConflictError If a user with the same email already exists.
   * @throws InternalServerError If there is an error during database insertion.
   */
  insertAppUser(newUser: AppUserInsert): Promise<AppUserResponse>;
}

export class PostgreSQLAppUserRepository implements AppUserRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findByEmail(email: string) {
    const sql: QueryConfig = {
      text: `select id::text as id, first_name as "firstName", last_name as "lastName", email, password_hash as "passwordHash" from app_user where email = $1::text`,
      values: [email],
    };

    try {
      return (await this.pool.query<AppUserEntity>(sql)).rows[0];
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database app user lookup error.`);
    }
  }

  async findOneAppUser(id: string) {
    const sql: QueryConfig = {
      text: `select id::text as id, first_name as "firstName", last_name as "lastName", email
      from app_user
      where id = $1`,
      values: [id],
    };
    try {
      return (await this.pool.query<AppUserResponse>(sql)).rows[0];
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database app user lookup error.`);
    }
  }

  async insertAppUser(newUser: AppUserInsert) {
    const sql: QueryConfig = {
      text: `insert into app_user (first_name, last_name, email, password_hash)
      values($1::text, $2::text, $3::text, $4::text)
      returning id::text as id, first_name as "firstName", last_name as "lastName", email`,
      values: [
        newUser.firstName,
        newUser.lastName,
        newUser.email,
        newUser.passwordHash,
      ],
    };
    try {
      return (await this.pool.query<AppUserResponse>(sql)).rows[0];
    } catch (err) {
      if ((err as any).code === "23505") {
        throw new ConflictError(`App user already exists.`);
      }
      this.logger.error(err);
      throw new InternalServerError(`Database app user insertion error.`);
    }
  }
}
