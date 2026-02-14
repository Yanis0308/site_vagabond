import { config } from "dotenv";
config({ path: import.meta.dirname + "/.env" });

import rootConfig from "../../eslint.config.mjs";
import { getSafeqlConfig } from "../../eslint-safeql.config.mjs";

const safeqlConfig = await getSafeqlConfig(process.env.SAFEQL_DATABASE_URL);

export default [
  ...rootConfig,
  ...safeqlConfig,
  { ignores: ["dist/", "drizzle.config.ts"] },
];
