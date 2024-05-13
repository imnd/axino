// load config from .env
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const loadEnv = () => {
  config({ path: path.dirname(fileURLToPath(import.meta.url)) + './../../../../.env' });
};

export default loadEnv;
