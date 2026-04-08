import { Pool } from "pg";

export default async function verifyDbConnection(pool: Pool) {
  await pool.query("SELECT 1");
}
