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
}
