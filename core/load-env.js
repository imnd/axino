/**
 * load config from .env
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const loadEnv = () => {
  // config({ path: path.dirname(fileURLToPath(import.meta.url)) + './../../../../.env' });
  config({ path: path.dirname(fileURLToPath(import.meta.url)) + './../../bookkeep-axino/.env' });
};

export default loadEnv;
