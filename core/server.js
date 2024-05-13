import loadEnv from "./load-env.js";
loadEnv();

// start server
import { createServer } from "node:http";
import RequestHandler from "./request-handler.js";
import { parseRoutes } from "./router.js";
import Yargs from "yargs";

let parsedRoutes;
const go = routes => {
  parsedRoutes = parseRoutes(routes);
  const port = Yargs.port ?? process.env.PORT;
  const hostname = process.env.HOSTNAME;
  createServer(async (req, res) => {
      await (new RequestHandler(req, res, parsedRoutes)).handle();
    })
    .listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}`);
    });
}

// bind callbacks to methods
const GET = (url, callback) => {
  parsedRoutes.get.push({ url, callback });
};
const POST = (url, callback) => {
  parsedRoutes.post.push({ url, callback });
};
const DELETE = (url, callback) => {
  parsedRoutes.get.push({ url, callback });
};

export { go, GET, POST, DELETE }
