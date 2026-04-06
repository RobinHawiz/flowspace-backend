import dotenv from "dotenv";
import build from "@/app.js";
import setupDI from "@config/setupDI.js";
import verifyDbConnection from "@config/verifyDbConnection.js";

dotenv.config();

try {
  setupDI();
  await verifyDbConnection();

  const app = build();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  await app.listen({
    port: port,
    host: "0.0.0.0",
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
