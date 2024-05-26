import { parseUrl } from "./router.js";

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  ERROR: 500,
};

const SUCCESS_STATUS_CODES = {
  GET: STATUS_CODES.OK,
  POST: STATUS_CODES.CREATED,
  PUT: STATUS_CODES.OK,
  DELETE: STATUS_CODES.NO_CONTENT,
};

const ERROR_MESSAGES = {
  [STATUS_CODES.NOT_FOUND]: "Not found"
};

export default class RequestHandler {
  #request
  #response
  #routes

  constructor (request, response, routes) {
    this.#request = request;
    this.#response = response;
    this.#routes = routes;
  }

  /**
   * handle request
   */
  async handle () {
    if (["POST", "PUT"].includes(this.#request.method)) {
      let body = "";
      this.#request.on("data", data => {
        body += data;
        // 1e6 === 1MB
        if (body.length > 1e6) {
          // Flood attack or faulty client, nuke request
          this.#end(413, "Request data if too large.");
          this.#request.connection.destroy();
        }
      });

      this.#request.on("end", async () => {
        let contentTypeArr = this.#request.headers["content-type"].split(";")
        const contentType = contentTypeArr[0];
        let postData = {};
        if (contentType === "multipart/form-data") {
          const boundary = contentTypeArr[1].split("=")[1];
          const bodyArr = body.split(boundary);
          bodyArr.shift();
          bodyArr.pop();
          for (const [index, item] of bodyArr.entries()) {
            let text = item
              .replace("Content-Disposition: form-data; ", "")
              .replace("\r\n--", "");

            let textArr = text
              .split("\r\n")
              .filter(line => line !== "");

            const name = textArr[0]
              .replace('name="', "")
              .replace('"', "")

            postData[name] = textArr[1];
          }
        } else if (["text/plain", "application/json"].includes(contentType)) {
          postData = JSON.parse(body);
        }
        await this.#getResponse(postData)
      });
    } else {
      await this.#getResponse()
    }
  }

  /**
   * finalize request
   */
  async #getResponse (postData) {
    const urlHandler = parseUrl(this.#request, this.#routes);
    if (urlHandler === null) {
      return this.#error(STATUS_CODES.NOT_FOUND);
    }

    const { callback, param } = urlHandler;
    if (callback === null) {
      return this.#error(STATUS_CODES.NOT_FOUND);
    }

    let action;
    // OK
    this.#response.setHeader("Content-Type", "text/plain");

    if (typeof callback === 'function') {
      action = () => (param === null ? callback(postData) : callback(param, postData));
    } else {
      if (callback.controller[callback.action] === undefined) {
        return this.#error(STATUS_CODES.NOT_FOUND);
      }
      action = () => (
          param === null ? callback.controller[callback.action](postData) : callback.controller[callback.action](param, postData)
      )
    }

    const resp = {};
    try {
      resp.code = SUCCESS_STATUS_CODES[this.#request.method];
      await action().then(result => {
        resp.contents = JSON.stringify(result);
      });
    } catch(err) {
      resp.code = STATUS_CODES.ERROR;
      resp.contents = err.message;
    }

    this.#end(resp.code, resp.contents);
  }

  /**
   * error handling
   */
  #error (code) {
    this.#end(code, ERROR_MESSAGES[code])
  }

  /**
   * end request
   */
  #end (code, contents) {
    this.#response.statusCode = code;
    this.#response.end(contents);
  }
}
