import { diContainer } from "@fastify/awilix";
import * as awilix from "awilix";
import createPostgreSQLPool from "@config/db.js";

export default function setupDI() {
  diContainer.register({
    pool: awilix
      .asFunction(createPostgreSQLPool)
      .singleton()
      .disposer((pool) => pool.end()),
  });
}
