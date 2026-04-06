import { Pool } from "pg";

export default function createPostgreSQLPool() {
  return new Pool({
    connectionTimeoutMillis: 5000,
  });
}
