import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

dotenv.config();

async function installDb() {
  console.log("Starting database installation...");

  const dbSql = readFileSync("./db/createDb.sql", "utf8");
  // Connect to the default "postgres" database to create the new database
  let pool = new Pool({
    database: "postgres",
    connectionTimeoutMillis: 5000,
  });

  try {
    // Create the database
    console.log("Creating database if it does not exist...");
    await pool.query(dbSql);
    console.log("Database created successfully.");
  } catch (err) {
    if ((err as any).code === "42P04") {
      console.log("Database already exists. Continuing with schema reset.");
    } else {
      console.error("Failed to create database:", err);
      return;
    }
  } finally {
    await pool.end();
  }

  const schemaSql = readFileSync("./db/schema.sql", "utf8");
  // Connect to the newly created database
  pool = new Pool({
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("Resetting database schema...");
    // Create the schema
    await pool.query(schemaSql);
    console.log("Database schema reset successfully.");
  } catch (error) {
    console.error("Failed to reset database schema:", error);
    return;
  } finally {
    await pool.end();
  }

  console.log("Database installation completed successfully.");
}

installDb();
