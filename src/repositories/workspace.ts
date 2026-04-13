import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { InternalServerError } from "@errors/appError.js";
import { WorkspaceEntity } from "@models/workspace.js";

export interface WorkspaceRepository {
  /**
   * Returns the workspaces for the current app user.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaces(id: number): Promise<Array<WorkspaceEntity>>;
  /**
   * Checks if a workspace with the given ID exists.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  checkWorkspaceExistance(workspace_id: string): Promise<boolean>;
  /**
   * Returns a specific workspace for the current app user.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findCurrentAppUserWorkspace(
    app_user_id: number,
    workspace_id: string,
  ): Promise<WorkspaceEntity | undefined>;
}

export class PostgreSQLWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaces(app_user_id: number) {
    const sql: QueryConfig = {
      text: `select w.id, w.title
            from workspace w
            where w.id in (
              select awu.workspace_id
              from assigned_workspace_user awu
              where awu.app_user_id = $1
            )`,
      values: [app_user_id],
    };
    try {
      return (await this.pool.query<WorkspaceEntity>(sql)).rows;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace lookup error.`);
    }
  }

  async checkWorkspaceExistance(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select 1 from workspace where id = $1`,
      values: [workspace_id],
    };
    try {
      return (await this.pool.query(sql)).rows.length > 0;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace lookup error.`);
    }
  }

  async findCurrentAppUserWorkspace(app_user_id: number, workspace_id: string) {
    const sql: QueryConfig = {
      text: `select w.id, w.title
            from workspace w
            where w.id = $1 and w.id in (
              select awu.workspace_id
              from assigned_workspace_user awu
              where awu.app_user_id = $2
            )`,
      values: [workspace_id, app_user_id],
    };
    try {
      return (await this.pool.query<WorkspaceEntity>(sql)).rows[0];
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace lookup error.`);
    }
  }
}
