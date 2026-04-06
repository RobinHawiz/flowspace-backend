import { diContainer } from "@fastify/awilix";
import type { Pool } from "pg";

export default async function verifyDbConnection() {
  const pool = diContainer.resolve<Pool>("pool");
  await pool.query("SELECT 1");
}
