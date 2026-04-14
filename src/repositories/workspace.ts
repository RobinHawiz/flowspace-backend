import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { InternalServerError } from "@errors/appError.js";
import {
  WorkspaceCreation,
  WorkspaceEntity,
  WorkspaceResponse,
} from "@models/workspace.js";

export interface WorkspaceRepository {
  /**
   * Returns the workspaces for the current app user.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaces(id: number): Promise<Array<WorkspaceResponse>>;
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
  ): Promise<WorkspaceResponse | undefined>;
  /**
   * Creates a workspace and assigns the current app user to it with an admin role.
   *
   * @throws InternalServerError If there is an error during database operation.
   */
  createWorkspace(
    app_user_id: number,
    payload: WorkspaceCreation,
  ): Promise<WorkspaceEntity>;
  /**
   * Updates the title of a workspace.
   *
   * @throws InternalServerError If there is an error during database update.
   */
  updateWorkspaceTitle(workspace_id: string, title: string): Promise<void>;
}

export class PostgreSQLWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaces(app_user_id: number) {
    const sql: QueryConfig = {
      text: `select w.id, w.title, awu.role
            from workspace w
            inner join assigned_workspace_user awu on awu.workspace_id = w.id
            where awu.app_user_id = $1`,
      values: [app_user_id],
    };
    try {
      return (await this.pool.query<WorkspaceResponse>(sql)).rows;
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
      text: `select w.id, w.title, awu.role
            from workspace w
            inner join assigned_workspace_user awu on awu.workspace_id = w.id
            where w.id = $1 and awu.app_user_id = $2`,
      values: [workspace_id, app_user_id],
    };
    try {
      return (await this.pool.query<WorkspaceResponse>(sql)).rows[0];
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace lookup error.`);
    }
  }

  async createWorkspace(app_user_id: number, payload: WorkspaceCreation) {
    const client = await this.pool.connect();
    await client.query("BEGIN");
    const sqlCreateWorkspace: QueryConfig = {
      text: `insert into workspace (title)
            values ($1::text)
            returning id, title`,
      values: [payload.title],
    };
    const sqlAssignWorkspace: QueryConfig = {
      text: `insert into assigned_workspace_user (workspace_id, app_user_id, role)
            values ($1, $2, 'admin')`,
      values: [0, app_user_id],
    };
    try {
      const workspace = (
        await client.query<WorkspaceEntity>(sqlCreateWorkspace)
      ).rows[0];
      sqlAssignWorkspace.values![0] = workspace.id;
      await client.query(sqlAssignWorkspace);
      await client.query("COMMIT");
      const output: WorkspaceResponse = {
        ...workspace,
        role: "admin",
      };
      return output;
    } catch (err) {
      await client.query("ROLLBACK");
      this.logger.error(err);
      throw new InternalServerError(`Database workspace insertion error.`);
    } finally {
      client.release();
    }
  }

  async updateWorkspaceTitle(workspace_id: string, title: string) {
    const sql: QueryConfig = {
      text: `update workspace set title = $1 where id = $2`,
      values: [title, workspace_id],
    };
    try {
      await this.pool.query(sql);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace update error.`);
    }
  }
}
