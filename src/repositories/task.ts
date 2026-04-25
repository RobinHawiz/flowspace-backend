import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@errors/appError.js";
import { TaskCreation, TaskResponse } from "@models/task.js";

export interface TaskRepository {
  /**
   * Returns the tasks of a workspace.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findWorkspaceTasks(workspace_id: string): Promise<Array<TaskResponse>>;
  /**
   * Creates a task.
   *
   * @throws ConflictError If a task with the same order already exists in the workspace column.
   * @throws InternalServerError If there is an error during database insertion.
   */
  createTask(payload: TaskCreation): Promise<TaskResponse>;
  /**
   * Finds the current order of a task.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findTaskOrder(
    workspace_column_id: string,
    task_id: string,
  ): Promise<number | null>;
  /**
   * Finds the largest order of the tasks in a workspace column.
   *
   * @throws InternalServerError If there is an error during database retrieval.
   */
  findLargestTaskOrder(workspace_column_id: string): Promise<number>;
  /**
   * Updates the order of a task within a workspace column.
   *
   * @throws ConflictError If a task with the same order already exists in the workspace column.
   * @throws InternalServerError If there is an error during database update.
   */
  updateTaskOrder(
    workspace_column_id: string,
    task_id: string,
    current_task_order: number,
    new_task_order: number,
    task_order_difference: number,
  ): Promise<void>;
}

export class PostgreSQLTaskRepository implements TaskRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaceTasks(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select t.id, t.workspace_column_id as "workspaceColumnId", t.title,
            t.description, t.priority, t.deadline, t.task_order as "taskOrder",
            t.created_at as "createdAt"
            from task t
            inner join workspace_column wc on wc.id = t.workspace_column_id
            where wc.workspace_id = $1
            order by wc.workspace_column_order, t.task_order`,
      values: [workspace_id],
    };
    try {
      return (await this.pool.query<TaskResponse>(sql)).rows;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database task lookup error.`);
    }
  }

  async createTask(payload: TaskCreation) {
    const sql: QueryConfig = {
      text: `insert into task (workspace_column_id, title, description, priority, deadline, task_order)
            values ($1, $2, $3, $4, $5, $6)
            returning id, workspace_column_id as "workspaceColumnId", title,
            description, priority, deadline, task_order as "taskOrder",
            created_at as "createdAt"`,
      values: [
        payload.workspaceColumnId,
        payload.title,
        payload.description ?? null,
        payload.priority,
        payload.deadline ?? null,
        payload.taskOrder,
      ],
    };
    try {
      return (await this.pool.query<TaskResponse>(sql)).rows[0];
    } catch (err) {
      if ((err as any).code === "23505") {
        throw new ConflictError(
          `A task with the same order already exists in this workspace column.`,
        );
      }
      this.logger.error(err);
      throw new InternalServerError(`Database task creation error.`);
    }
  }

  async findTaskOrder(workspace_column_id: string, task_id: string) {
    const sql: QueryConfig = {
      text: `select task_order as "taskOrder" from task
            where workspace_column_id = $1 and id = $2`,
      values: [workspace_column_id, task_id],
    };
    try {
      const result = await this.pool.query<{ taskOrder: number }>(sql);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0].taskOrder;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database task lookup error.`);
    }
  }

  async findLargestTaskOrder(workspace_column_id: string) {
    const sql: QueryConfig = {
      text: `select task_order from task
            where workspace_column_id = $1
            order by task_order desc
            limit 1`,
      values: [workspace_column_id],
    };
    try {
      const result = await this.pool.query<{ task_order: number }>(sql);
      if (result.rows.length === 0) {
        return 0;
      }
      return result.rows[0].task_order;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerError(`Database task lookup error.`);
    }
  }

  async updateTaskOrder(
    workspace_column_id: string,
    task_id: string,
    current_task_order: number,
    new_task_order: number,
    task_order_difference: number,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // If the task is being moved forward, the tasks between the current and new order should be moved backward.
      const sqlReindexPrecedingTasks = `
      set task_order = task_order - 1
      where workspace_column_id = $1 and task_order <= $2 and task_order > $3`;
      // If the task is being moved backward, the tasks between the current and new order should be moved forward.
      const sqlReindexSubsequentTasks = `
      set task_order = task_order + 1
      where workspace_column_id = $1 and task_order >= $2 and task_order < $3`;

      const sqlReindexTasks: QueryConfig = {
        text: `update task
            ${task_order_difference > 0 ? sqlReindexPrecedingTasks : sqlReindexSubsequentTasks}`,
        values: [workspace_column_id, new_task_order, current_task_order],
      };

      const sqlReindexSelectedTask: QueryConfig = {
        text: `update task
            set task_order = $1
            where workspace_column_id = $2 and id = $3
            returning id`,
        values: [new_task_order, workspace_column_id, task_id],
      };

      if (task_order_difference !== 0) {
        await client.query(sqlReindexTasks);
      }

      const result = await client.query<{ id: string }>(sqlReindexSelectedTask);
      if (result.rows.length === 0) {
        throw new NotFoundError(
          `Task with the given ID does not exist in this workspace column.`,
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
          `A task with the same order already exists in this workspace column.`,
        );
      }
      this.logger.error(err);
      throw new InternalServerError(`Database task update error.`);
    } finally {
      client.release();
    }
  }
}
