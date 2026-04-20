import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { InternalServerError } from "@errors/appError.js";
import { WorkspaceColumnResponse } from "@models/workspaceColumn.js";

export interface WorkspaceColumnRepository {
  /**
   * Returns the columns of a workspace.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaceColumns(
    workspace_id: string,
  ): Promise<Array<WorkspaceColumnResponse>>;
}

export class PostgreSQLWorkspaceColumnRepository
  implements WorkspaceColumnRepository
{
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaceColumns(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select id, title, workspace_column_order as "workspaceColumnOrder"
            from workspace_column
            where workspace_id = $1
            order by workspace_column_order`,
      values: [workspace_id],
    };
    try {
      return (await this.pool.query<WorkspaceColumnResponse>(sql)).rows;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace column lookup error.`);
    }
  }
}
