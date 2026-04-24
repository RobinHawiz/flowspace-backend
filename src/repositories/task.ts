import { FastifyBaseLogger } from "fastify";
import { Pool, QueryConfig } from "pg";
import { ConflictError, InternalServerError } from "@errors/appError.js";
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
}
