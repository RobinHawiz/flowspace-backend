import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@errors/appError.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnResponse,
  WorkspaceColumnTitleUpdate,
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
   * Checks if a workspace column with the given ID exists in the workspace.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  checkWorkspaceColumnExistance(
    workspace_id: string,
    workspace_column_id: string,
  ): Promise<boolean>;
  /**
   * Creates a workspace column.
   *
   * @throws ConflictError If a column with the same order already exists in this workspace.
   * @throws InternalServerError If there is an error during database insertion.
   */
  createWorkspaceColumn(
    workspace_id: string,
    payload: WorkspaceColumnCreation,
  ): Promise<WorkspaceColumnResponse>;
  /**
   * Deletes a workspace column and reindexes the subsequent columns.
   *
   * @throws InternalServerError If there is an error during database deletion.
   */
  deleteWorkspaceColumn(
    workspace_id: string,
    workspace_column_id: string,
  ): Promise<void>;
  /**
   * Updates the title of a workspace column and returns whether the update was successful.
   *
   * @throws InternalServerError If there is an error during database update.
   */
  updateWorkspaceColumnTitle(
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnTitleUpdate,
  ): Promise<boolean>;
  /**
   * Updates the order of a workspace column and returns whether the update was successful.
   *
   * @throws ConflictError If a column with the same order already exists in this workspace.
   * @throws InternalServerError If there is an error during database update.
   */
  updateWorkspaceColumnOrder(
    workspace_id: string,
    workspace_column_id: string,
    current_column_order: number,
    new_column_order: number,
    column_order_difference: number,
  ): Promise<void>;
  /**
   * Finds the order of a workspace column.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaceColumnOrder(
    workspace_id: string,
    workspace_column_id: string,
  ): Promise<number | null>;
  /**
   * Finds the largest order of the columns in a workspace.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findLargestWorkspaceColumnOrder(workspace_id: string): Promise<number>;
}

export class PostgreSQLWorkspaceColumnRepository implements WorkspaceColumnRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaceColumns(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select id::text as id, title, workspace_column_order as "workspaceColumnOrder"
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

  async checkWorkspaceColumnExistance(
    workspace_id: string,
    workspace_column_id: string,
  ) {
    const sql: QueryConfig = {
      text: `select 1 from workspace_column
            where workspace_id = $1 and id = $2`,
      values: [workspace_id, workspace_column_id],
    };
    try {
      return (await this.pool.query(sql)).rows.length > 0;
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
            returning id::text as id, title, workspace_column_order as "workspaceColumnOrder"`,
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
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const sql: QueryConfig = {
        text: `delete from workspace_column 
            where workspace_id = $1 and id = $2
            returning workspace_column_order`,
        values: [workspace_id, workspace_column_id],
      };

      const removedWorkspaceColumn = (
        await client.query<{ workspace_column_order: number }>(sql)
      ).rows[0];
      if (!removedWorkspaceColumn) {
        throw new NotFoundError(
          `Workspace column with the given ID does not exist in this workspace.`,
        );
      }

      const sqlReindexColumns: QueryConfig = {
        text: `update workspace_column
            set workspace_column_order = workspace_column_order - 1
            where workspace_id = $1 and workspace_column_order > $2`,
        values: [workspace_id, removedWorkspaceColumn.workspace_column_order],
      };

      await client.query(sqlReindexColumns);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      if (err instanceof AppError) {
        throw err;
      }
      this.logger.error(err);
      throw new InternalServerError(
        `Database workspace column deletion error.`,
      );
    } finally {
      client.release();
    }
  }

  async updateWorkspaceColumnTitle(
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnTitleUpdate,
  ) {
    const sql: QueryConfig = {
      text: `update workspace_column
            set title = $1
            where workspace_id = $2 and id = $3
            returning id::text as id`,
      values: [payload.title, workspace_id, workspace_column_id],
    };
    try {
      return (await this.pool.query<{ id: string }>(sql)).rows.length === 1;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace column update error.`);
    }
  }

  async updateWorkspaceColumnOrder(
    workspace_id: string,
    workspace_column_id: string,
    current_column_order: number,
    new_column_order: number,
    column_order_difference: number,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // If the column is being moved forward, the columns between the current and new order should be moved backward.
      const sqlReindexPrecedingColumns = `
      set workspace_column_order = workspace_column_order - 1
      where workspace_id = $1 and workspace_column_order <= $2 and workspace_column_order > $3`;
      // If the column is being moved backward, the columns between the current and new order should be moved forward.
      const sqlReindexSubsequentColumns = `
      set workspace_column_order = workspace_column_order + 1
      where workspace_id = $1 and workspace_column_order >= $2 and workspace_column_order < $3`;

      const sqlReindexColumns: QueryConfig = {
        text: `update workspace_column
            ${column_order_difference > 0 ? sqlReindexPrecedingColumns : sqlReindexSubsequentColumns}`,
        values: [workspace_id, new_column_order, current_column_order],
      };

      const sqlReindexSelectedColumn: QueryConfig = {
        text: `update workspace_column
            set workspace_column_order = $1
            where workspace_id = $2 and id = $3
            returning id::text as id`,
        values: [new_column_order, workspace_id, workspace_column_id],
      };

      if (column_order_difference !== 0) {
        await client.query(sqlReindexColumns);
      }

      const result = await client.query<{ id: string }>(
        sqlReindexSelectedColumn,
      );
      if (result.rows.length === 0) {
        throw new NotFoundError(
          `Workspace column with the given ID does not exist in this workspace.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      if (err instanceof AppError) {
        throw err;
      }
      if ((err as any).code === "23505") {
        throw new ConflictError(
          `A column with the same order already exists in this workspace.`,
        );
      }
      this.logger.error(err);
      throw new InternalServerError(`Database workspace column update error.`);
    } finally {
      client.release();
    }
  }

  async findWorkspaceColumnOrder(
    workspace_id: string,
    workspace_column_id: string,
  ) {
    const sql: QueryConfig = {
      text: `select workspace_column_order from workspace_column
            where workspace_id = $1 and id = $2`,
      values: [workspace_id, workspace_column_id],
    };
    try {
      const result = await this.pool.query<{ workspace_column_order: number }>(
        sql,
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0].workspace_column_order;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace column lookup error.`);
    }
  }

  async findLargestWorkspaceColumnOrder(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select workspace_column_order from workspace_column
            where workspace_id = $1
            order by workspace_column_order desc
            limit 1`,
      values: [workspace_id],
    };
    try {
      const result = await this.pool.query<{ workspace_column_order: number }>(
        sql,
      );
      if (result.rows.length === 0) {
        return 0;
      }
      return result.rows[0].workspace_column_order;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database workspace column lookup error.`);
    }
  }
}
