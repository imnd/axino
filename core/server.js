import loadEnv from "./load-env.js";
loadEnv();

// start server
import { createServer } from "node:http";
import RequestHandler from "./request-handler.js";
import { parseRoutes } from "./router.js";
import Yargs from "yargs";

// import routes from "./../../../../routes.js";
import routes from "./../../bookkeep-axino/routes.js";
const parsedRoutes = parseRoutes(routes);

export default {
  start: () => {
    const port = Yargs.port ?? process.env.PORT;
    const hostname = process.env.HOSTNAME;
    createServer(async (req, res) => {
      await (new RequestHandler(req, res, parsedRoutes)).handle();
    })
      .listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}`);
      })
    ;
  },
  // bind callbacks to methods
  get: (url, callback) => {
    parsedRoutes.get[url] ??= [];
    parsedRoutes.get[url].push({ callback });
  },
  post: (url, callback) => {
    parsedRoutes.post[url] ??= [];
    parsedRoutes.post[url].push({ callback });
  },
  delete: (url, callback) => {
    parsedRoutes.delete[url] ??= [];
    parsedRoutes.delete[url].push({ callback });
  }
}
