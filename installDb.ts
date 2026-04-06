import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

dotenv.config();

let pool = new Pool({
  database: "postgres",
  connectionTimeoutMillis: 5000,
});

const dbSql = readFileSync("./db/createDb.sql", "utf8");
const schemaSql = readFileSync("./db/schema.sql", "utf8");

try {
  // Create the database
  await pool.query(dbSql);
  await pool.end();

  // Connect to the newly created database
  pool = new Pool({
    connectionTimeoutMillis: 5000,
  });

  // Create the schema
  await pool.query(schemaSql);

  console.log("Database installation completed successfully.");
} catch (error) {
  console.error("Error during database installation:", error);
} finally {
  await pool.end();
}
