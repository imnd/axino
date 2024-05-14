export default class HttpError extends Error {
  code

  constructor(name, code, description, isOperational) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name
    this.code = code;
    this.isOperational = isOperational ?? true;

    Error.captureStackTrace(this);
  }
}

export class Http404Error extends HttpError {
  constructor(isOperational) {
    super('Http404Error', HttpStatusCode.NOT_FOUND, 'Not found', isOperational);
  }
}

export class HttpStatusCode {
  OK = 200
  BAD_REQUEST = 400
  NOT_FOUND = 404
  INTERNAL_SERVER = 500
}
