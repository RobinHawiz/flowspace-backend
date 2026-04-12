import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "JWT_SECRET_KEY",
  "CORS_ORIGINS",
  "PGUSER",
  "PGPASSWORD",
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("The following environment variables are missing:");
  missingVars.forEach((varName) => console.error(`- ${varName}`));
  console.error(
    "Please add required environment variables before continuing...",
  );
  process.exit(1);
} else {
  console.log("All required Environment variables are set!");
}
