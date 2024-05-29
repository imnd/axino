import DBAL from "./dbal.js";
import { camelToSnake } from "../../components/helpers.js";
import { Http404Error } from "../http-error.js";

export default class Model {
  _db;
  _table;
  _pk = "id";
  _attributes = {};

  constructor() {
    if (this._table === undefined) {
      this._table = camelToSnake(this.constructor.name);
    }

    this._db = DBAL.getInstance({
      table: this._table,
      pk: this._pk,
    });

    return new Proxy(this, {
      get: function(model, field) {
        if (field in model._attributes) {
          return model._attributes[field];
        }

        return model[field];
      }
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
    const result = await model._db.create(data);

    return model
      .setAttributes({
        ...{ [model._pk]: result.insertId },
        ...data
      });
  }

  static async find(params) {
    const model = new this();
    const result = await model._db.find(params);
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
    const result = await (new this())._db.findAll(where);

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

    await model._db
      .update(values)
      .where({ [model._pk]: id })
      .execute()
    ;

    return model;
  }

  static async updateOrFail(id, values) {
    await this.findOrFail(id);
    return this.update(id, values);
  }

  static async destroy(id) {
    return await (new this())._db.destroy(id);
  }

  static async destroyOrFail(id) {
    await this.findOrFail(id);
    return this.destroy(id);
  }
}
