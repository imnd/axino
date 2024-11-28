import DBAL from "./dbal.js";
import { camelToSnake } from "../../components/helpers.js";
import { Http404Error } from "../http-error.js";

export default class Model {
  fields = [];

  static _db;
  static _table;
  static _pk = "id";

  constructor() {
    if (this._table === undefined) {
      this._table = camelToSnake(this.constructor.name);
    }

    this._db = new DBAL({
      table: this._table,
      _pk: this._pk,
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

  static _instance;

  /**
   * Singleton object
   * @returns {Model}
   */
  static getInstance() {
    if (this._instance === undefined) {
      this._instance = new this();
    }

    return this._instance;
  }

  _attributes = {};

  getAttributes() {
    return this._attributes;
  }

  setAttributes(data) {
    const prefix = this.getFieldPrefix();
    for (const field of this.fields) {
      this._attributes[field] = data[prefix + field];
    }

    return this;
  }

  getFieldPrefix() {
    return `${this._table}_`;
  }

  _with = [];

  _relations = [];

  getRelations() {
    return this._relations;
  }

  setRelations(data) {
    this._relations = {};
    for (const _with of this._with) {
      const relation = this[_with];
      const relationModel = relation.model;
      this._relations[_with] = [];
      for (const datum of data) {
        this._relations[_with].push((new relationModel).setAttributes(datum));
      }
    }

    return this;
  }

  static with(relationName) {
    const _this = this.getInstance();

    _this._with.push(relationName);

    const relation = _this[relationName];

    if (relation) {
      const { type, model, key } = relation;
      const table = (new model)._table;
      if (type === "hasMany") {
        _this._db.addHasManyJoin({ table, key });
      } else if (type === "belongsTo") {
        _this._db.addBelongsToJoin({ table, key });
      }
    }

    return this;
  }

  static flushWith() {
    const _this = this.getInstance();
    _this._with = [];

    return this;
  }

  static select() {
    const _this = this.getInstance();

    _this._db.select([...[this._pk], ..._this.fields]);

    for (const _with of _this._with) {
      const relation = _this[_with];
      const relationModel = new relation.model;

      _this._db.select([...[relation.model._pk], ...relationModel.fields], relationModel._table)
    }
  }

  static orderBy(field, order, table) {
    this.getInstance()._db.orderBy(field, order, table);
  }

  static async create(data) {
    const _this = this.getInstance();
    const result = await _this._db.create(data);

    return _this
      .setAttributes({
        ...{ [_this._pk]: result.insertId },
        ...data
      });
  }

  static async find(params) {
    this.select();

    const _this = this.getInstance();
    const result = await _this._db.find(params);

    if (result === undefined) {
      return undefined;
    }

    _this
      .setAttributes(result[0])
      .setRelations(result);

    this.flushWith();

    return _this;
  }

  static async findOrFail(params) {
    const model = await this.find(params);
    if (model === undefined) {
      throw new Http404Error();
    }
    return model;
  }

  static async findAll(where) {
    this.select();

    let result = await this.getInstance()._db
      .orderBy(this._pk)
      .findAll(where);

    const models = [];
    if (result !== undefined) {
      const prefix = this.getInstance().getFieldPrefix();
      const parentPkField = `${prefix}${this._pk}`;
      const pks = [];
      for (const data of result) {
        const pk = data[parentPkField];
        if (!pks.includes(pk)) {
          pks.push(pk);
        }
      }

      for (const pk of pks) {
        const subset = result.filter(datum => {
          return datum[parentPkField] === pk
        });

        models.push(
            (new this()).setAttributes(subset[0])
            .setRelations(subset)
        );
      }
    }

    this.flushWith();

    return models;
  }

  static async update(id, values) {
    const _this = this.getInstance();

    await _this._db
        .update(values)
        .where({ [_this._pk]: id })
        .execute();

    return _this;
  }

  static async updateOrFail(id, values) {
    await this.findOrFail(id);
    return this.update(id, values);
  }

  static async destroy(id) {
    return await this.getInstance()._db.destroy(id);
  }

  static async destroyOrFail(id) {
    await this.findOrFail(id);
    return this.destroy(id);
  }
}
