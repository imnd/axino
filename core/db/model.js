import DBAL from "./dbal.js";
import { camelToKebab } from "../../components/helpers.js";
import { Http404Error } from "../http-error.js";

export default class Model {
  #db;
  #table;
  #pk = "id";

  _attributes = {};

  constructor() {
    if (this.#table === undefined) {
      this.#table = camelToKebab(this.constructor.name);
    }
    this.#db = new DBAL({
      table: this.#table,
      pk: this.#pk,
    });
  }

  getAttributes() {
    return this._attributes;
  }

  setAttributes(attributes) {
    this._attributes = attributes;
    return this;
  }

  static async create(data) {
    const model = new this();
    const result = await model.#db.create(data);

    return model
      .setAttributes({
        ...{ [model.#pk]: result.insertId },
        ...data
      });
  }

  static async find(params) {
    const model = new this();
    const result = await model.#db.find(params);
    if (result === undefined) {
      return undefined;
    }

    return model.setAttributes(result);
  }

  static async findOrFail(params) {
    const model = await this.find(params);
    if (model === undefined) {
      throw new Http404Error();
    }
    return model;
  }

  static async findAll(where) {
    const result = await (new this()).#db.findAll(where);

    const models = [];
    if (result !== undefined) {
      for (const data of result) {
        models.push((new this()).setAttributes(data))
      }
    }

    return models;
  }

  static async update(id, values) {
    const model = new this();
    model.#db
      .update(values);

    model.#db
      .update(values)
      .where({ [model.#pk]: id });

    await model.#db
      .update(values)
      .where({ [model.#pk]: id })
      .execute()
    ;

    return model;
  }

  static async updateOrFail(id, values) {
    await this.findOrFail(id);
    return this.update(id, values);
  }

  static async destroy(id) {
    return await (new this()).#db.destroy(id);
  }

  static async destroyOrFail(id) {
    await this.findOrFail(id);
    return this.destroy(id);
  }
}
