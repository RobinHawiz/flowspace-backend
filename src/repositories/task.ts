import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@errors/appError.js";
import { TaskCreation, TaskResponse, TaskUpdate } from "@models/task.js";

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
  findLargestTaskOrder(workspace_column_id: string): Promise<number | null>;
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
  /**
   * Updates a task.
   *
   * @throws NotFoundError If the task does not exist in the workspace.
   * @throws InternalServerError If there is an error during database update.
   */
  updateTask(
    workspace_id: string,
    task_id: string,
    payload: TaskUpdate,
  ): Promise<void>;
  /**
   * Deletes a task and reindexes the subsequent tasks in the same workspace column.
   *
   * @throws NotFoundError If the task does not exist in the workspace.
   * @throws InternalServerError If there is an error during database deletion.
   */
  deleteTask(workspace_id: string, task_id: string): Promise<void>;
  /**
   * Moves a task to a different workspace column and reindexes the tasks in both the previous and new workspace columns.
   *
   * @throws NotFoundError If the task does not exist in the workspace or if the new workspace column does not exist in the workspace.
   * @throws ConflictError If a task with the same order already exists in the new workspace column.
   * @throws InternalServerError If there is an error during database update.
   */
  moveTaskToDifferentColumn(
    workspace_id: string,
    task_id: string,
    prev_task_order: number,
    prev_workspace_column_id: string,
    new_task_order: number,
    new_workspace_column_id: string,
  ): Promise<void>;
}

export class PostgreSQLTaskRepository implements TaskRepository {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async findWorkspaceTasks(workspace_id: string) {
    const sql: QueryConfig = {
      text: `select t.id::text as id, t.workspace_column_id::text as "workspaceColumnId", t.title,
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
            returning id::text as id, workspace_column_id::text as "workspaceColumnId", title,
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
        return null;
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
            returning id::text as id`,
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

  async updateTask(workspace_id: string, task_id: string, payload: TaskUpdate) {
    const sql: QueryConfig = {
      text: `update task t
            set title = $1, description = $2, priority = $3, deadline = $4
            from workspace_column wc
            where t.workspace_column_id = wc.id
            and wc.workspace_id = $5
            and t.id = $6
            returning t.id::text as id`,
      values: [
        payload.title,
        payload.description ?? null,
        payload.priority,
        payload.deadline ?? null,
        workspace_id,
        task_id,
      ],
    };
    try {
      const result = await this.pool.query<{ id: string }>(sql);
      if (result.rows.length === 0) {
        throw new NotFoundError(
          `Task with the given ID does not exist in this workspace.`,
        );
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      this.logger.error(err);
      throw new InternalServerError(`Database task update error.`);
    }
  }

  async deleteTask(workspace_id: string, task_id: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const sql: QueryConfig = {
        text: `delete from task t
            using workspace_column wc
            where t.workspace_column_id = wc.id
            and wc.workspace_id = $1
            and t.id = $2
            returning t.workspace_column_id::text as "workspaceColumnId", t.task_order as "taskOrder"`,
        values: [workspace_id, task_id],
      };

      const removedTask = (
        await client.query<{ workspaceColumnId: string; taskOrder: number }>(
          sql,
        )
      ).rows[0];
      if (!removedTask) {
        throw new NotFoundError(
          `Task with the given ID does not exist in this workspace.`,
        );
      }

      const sqlReindexTasks: QueryConfig = {
        text: `update task
            set task_order = task_order - 1
            where workspace_column_id = $1 and task_order > $2`,
        values: [removedTask.workspaceColumnId, removedTask.taskOrder],
      };

      await client.query(sqlReindexTasks);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      if (err instanceof AppError) {
        throw err;
      }
      this.logger.error(err);
      throw new InternalServerError(`Database task deletion error.`);
    } finally {
      client.release();
    }
  }

  async moveTaskToDifferentColumn(
    workspace_id: string,
    task_id: string,
    prev_task_order: number,
    prev_workspace_column_id: string,
    new_task_order: number,
    new_workspace_column_id: string,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const sqlUpdateTask: QueryConfig = {
        text: `update task t
            set workspace_column_id = $1, task_order = $2
            from workspace_column wc
            where wc.id = t.workspace_column_id
            and wc.id = $3
            and wc.workspace_id = $4
            and t.id = $5
            returning t.id::text as id`,
        values: [
          new_workspace_column_id,
          new_task_order,
          prev_workspace_column_id,
          workspace_id,
          task_id,
        ],
      };

      const sqlReindexPrevColumnTasks: QueryConfig = {
        text: `update task
      set task_order = task_order - 1
      where workspace_column_id = $1 and task_order > $2`,
        values: [prev_workspace_column_id, prev_task_order],
      };

      const sqlReindexNewColumnTasks: QueryConfig = {
        text: `update task
      set task_order = task_order + 1
      where workspace_column_id = $1 and task_order >= $2`,
        values: [new_workspace_column_id, new_task_order],
      };

      // Reindex the tasks in the previous workspace column.
      await client.query(sqlReindexPrevColumnTasks);
      // Reindex the tasks in the new workspace column.
      await client.query(sqlReindexNewColumnTasks);
      // Change the task workspace_column_id and task_order to the new values after reindexing to prevent conflicts.
      const updatedTask = (
        await client.query<{ id: string }>(sqlUpdateTask)
      ).rows[0];
      if (!updatedTask) {
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
