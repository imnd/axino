import { parseUrl } from "./router.js";

const STATUS_CODE_OK = 200;
const STATUS_CODE_CREATED = 201;
const STATUS_CODE_NO_CONTENT = 204;
const STATUS_CODE_NOT_FOUND = 404;
const STATUS_CODE_ERROR = 500;

const SUCCESS_STATUS_CODES = {
  GET: STATUS_CODE_OK,
  POST: STATUS_CODE_CREATED,
  PUT: STATUS_CODE_OK,
  DELETE: STATUS_CODE_NO_CONTENT,
};

const ERROR_MESSAGES = {
  [STATUS_CODE_NOT_FOUND]: "Not found"
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
        this.#error(STATUS_CODE_NOT_FOUND);
        return;
      }

      const { callback, param } = urlHandler;
      if (callback === null) {
        this.#error(STATUS_CODE_NOT_FOUND);
        return;
      }

      let action;
      // OK
      this.#response.setHeader("Content-Type", "text/plain");

      if (typeof callback === 'function') {
        action = () => (param === null ? callback(postData) : callback(param, postData));
      } else {
        action = () => (
            param === null ? callback.controller[callback.action](postData) : callback.controller[callback.action](param, postData)
        )
      }

      try {
        this.#end(SUCCESS_STATUS_CODES[this.#request.method], JSON.stringify(await action()))
      } catch(err) {
        this.#end(STATUS_CODE_ERROR, err.message)
      }
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
