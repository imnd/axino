import loadEnv from "../load-env.js";
import mysql from 'mysql2/promise';
import pgsql from "pgsql";
import { isObject } from "../../components/helpers.js";

export default class DBAL {
  #connection;
  #config;

  #pk = "id";
  #table;
  #query;
  #params;
  #where;
  #select = "*";

  constructor(params) {
    loadEnv();

    this.#config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    if (params === undefined) {
      return;
    }

    if (params.table !== undefined) {
      this.#table = params.table;
    }

    if (params.pk !== undefined) {
      this.#pk = params.pk;
    }
  }

  async #connect() {
    if (this.#connection !== undefined) {
      return;
    }

    switch (process.env.DB_DIALECT) {
      case "mysql":
        this.#connection = await mysql.createConnection(this.#config);
        break;
      case "pgsql":
        this.#connection = await pgsql.createConnection(this.#config);
        break;
    }
  }

  select(fields) {
    this.#select = this.#prepareSelect(fields);

    return this;
  }

  table(table) {
    this.#table = table;

    return this;
  }

  from(table) {
    this.#table = table;

    return this;
  }

  where(where) {
    if (where !== undefined) {
      this.#where = this.#prepareKeyValues(where);
    }

    return this;
  }

  query(sql) {
    this.#query = sql;

    return this;
  }

  update(values, table) {
    table ??= this.#table

    return this.query(`UPDATE ${table} SET ${this.#prepareKeyValues(values)}`);
  }

  #getWhere(params) {
    if (params === undefined) {
      return undefined;
    }

    let where;
    if (isObject(params)) {
      where = params
    } else {
      where = {
        [this.#pk]: params,
      }
    }

    return where
  }

  #setWhere(where) {
    if (where !== undefined) {
      this.where(where);
    }

    if (this.#where !== undefined) {
      this.#query += ` WHERE ${this.#where}`;
      this.#where = undefined;
    }

    return this;
  }

  #prepareSelect(fields) {
    fields ??= ["*"]

    if (!Array.isArray(fields)) {
      fields = [fields];
    }
    return fields.join(",");
  }

  #prepareKeyValues(values) {
    if (values === undefined) {
      return "";
    }

    let valuesArr = [];
    for (const key in values) {
      valuesArr.push(`${key}="${values[key]}"`);
    }
    return valuesArr.join(",");
  }

  #prepareKeys(values) {
    if (values === undefined) {
      return "";
    }

    let valuesArr = [];
    for (const key in values) {
      valuesArr.push(`${key}`);
    }
    return valuesArr.join(",");
  }

  #prepareValues(values) {
    if (values === undefined) {
      return "";
    }
    let valuesArr = [];
    for (const key in values) {
      valuesArr.push(`'${values[key]}'`);
    }

    return valuesArr.join(",");
  }

  async create(values, table) {
    table ??= this.#table

    return await this
      .query(`
        INSERT INTO ${table} (${this.#prepareKeys(values)})
        VALUES (${this.#prepareValues(values)})
      `)
      .execute();
  }

  async find(params, select) {
    select ??= this.#select

    const result = await this
      .select(select)
      .where(this.#getWhere(params))
      .findAll()
    ;

    if (result.length) {
      return result[0];
    }
  }

  async findAll(where) {
    this
      .query(`SELECT ${this.#select} FROM ${this.#table}`)
      .#setWhere(where);

    await this.#connect();
    const [ result, ] = await this.#connection.execute(this.#query, this.#params);
    return result;
  }

  async destroy(where, table) {
    table ??= this.#table

    return await this
      .query(`DELETE FROM ${table}`)
      .#setWhere(this.#getWhere(where))
      .execute();
  }

  async execute(query) {
    await this.#connect();
    this
      .query(query ?? this.#query)
      .#setWhere();

    const [ result, ] = await this.#connection.execute(this.#query);
    return result;
  }
}
