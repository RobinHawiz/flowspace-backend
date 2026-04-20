import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { ConflictError, InternalServerError } from "@errors/appError.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnResponse,
} from "@models/workspaceColumn.js";

export interface WorkspaceColumnRepository {
  /**
   * Returns the columns of a workspace.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaceColumns(
    workspace_id: string,
  ): Promise<Array<WorkspaceColumnResponse>>;
  /**
   * Creates a workspace column.
   *
   * @throws InternalServerError If there is an error during database insertion.
   */
  createWorkspaceColumn(
    workspace_id: string,
    payload: WorkspaceColumnCreation,
  ): Promise<WorkspaceColumnResponse>;
  /**
   * Deletes a workspace column and returns whether the deletion was successful.
   *
   * @throws InternalServerError If there is an error during database deletion.
   */
  deleteWorkspaceColumn(
    workspace_id: string,
    workspace_column_id: string,
  ): Promise<boolean>;
}

export class PostgreSQLWorkspaceColumnRepository implements WorkspaceColumnRepository {
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

  async createWorkspaceColumn(
    workspace_id: string,
    payload: WorkspaceColumnCreation,
  ) {
    const sql: QueryConfig = {
      text: `insert into workspace_column (workspace_id, title, workspace_column_order)
            values ($1, $2, $3)
            returning id, title, workspace_column_order as "workspaceColumnOrder"`,
      values: [workspace_id, payload.title, payload.workspaceColumnOrder],
    };
    try {
      return (await this.pool.query<WorkspaceColumnResponse>(sql)).rows[0];
    } catch (err) {
      if ((err as any).code === "23505") {
        throw new ConflictError(
          `A column with the same order already exists in this workspace.`,
        );
      }
      this.logger.error(err);
      throw new InternalServerError(
        `Database workspace column creation error.`,
      );
    }
  }

  async deleteWorkspaceColumn(
    workspace_id: string,
    workspace_column_id: string,
  ) {
    const sql: QueryConfig = {
      text: `delete from workspace_column 
            where workspace_id = $1 and id = $2
            returning id`,
      values: [workspace_id, workspace_column_id],
    };
    try {
      return (await this.pool.query<{ id: string }>(sql)).rows.length === 1;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(
        `Database workspace column deletion error.`,
      );
    }
  }
}
