import { isObject } from "../../components/helpers.js";
import Connection from "./connection.js";

export default class DBAL {
  #pk = "id";
  #table;

  #query;
  #fields = "";
  #where = "";
  #belongsToJoins = [];
  #hasManyJoins = [];
  #joins = [];
  #orders = [];
  #limit;
  #offset;
  #groupBy;

  constructor(params) {
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

  #getWhere(params) {
    if (params === undefined) {
      return undefined;
    }

    let where;
    if (isObject(params)) {
      where = params
    } else {
      where = {
        [`${this.#table}.${this.#pk}`]: params,
      }
    }

    return where
  }

  #setQueryConditions(where) {
    if (where !== undefined) {
      this.#where = this.#prepareKeyValues(where);
    }

    if (this.#where !== "") {
      this.#query += ` WHERE ${this.#where}`;
      this.#where = "";
    }

    return this;
  }

  #prepareSelect(_fields, table) {
    if (!Array.isArray(_fields)) {
      _fields = [_fields];
    }
    if (_fields.length === 0) {
      return [];
    }

    const fields = [ ..._fields ];

    table ??= this.#table;

    for (const ind in fields) {
      fields[ind] = `${table}.${fields[ind]} as ${table}_${fields[ind]}`
    }

    return fields.join(",");
  }

  #prepareKeyValues(values) {
    if (values === undefined) {
      return "";
    }

    const valuesArr = [];
    for (const key in values) {
      let operator = "=";
      let value = values[key];
      let firstSymbol = value.substring(0, 1);
      if (firstSymbol === "<" || firstSymbol === ">") {
        value = value.substring(1);
        operator = firstSymbol;
      }
      let secondSymbol = value.substring(0, 1);
      if (secondSymbol === "=") {
        value = value.substring(1);
        operator += "=";
      }
      valuesArr.push(`${key}${operator}"${value}"`);
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

  #joinQuery(join) {
    const { table, key } = join;
    return ` JOIN ${table} ON ${table}.${key} = ${this.#table}.${this.#pk}`;
  }

  #downJoinQuery(join) {
    const { table, key } = join;
    return ` JOIN ${table} ON ${this.#table}.${key} = ${table}.${this.#pk}`;
  }

  #orderQuery(orderBy) {
    let { field, order, table } = orderBy;
    field ??= this.#pk
    table ??= this.#table
    order ??= "ASC";

    return ` ${table}.${field} ${order}`;
  }

  #flush() {
    this.#joins = [];
    this.#orders = [];
    this.#fields = "";
    this.#where = "";
  }

  async #execute() {
    this.#flush();
    const connection = await Connection.getInstance().getConnection();


    const [ result, ] = await connection.execute(this.#query);

    return result;
  }

  // Client code

  addHasManyJoin(join) {
    this.#hasManyJoins.push(join);

    return this;
  }

  addBelongsToJoin(join) {
    this.#belongsToJoins.push(join);

    return this;
  }

  select(fields, table) {
    const preparedSelect = this.#prepareSelect(fields, table);

    if (this.#fields !== "" && preparedSelect !== "") {
      this.#fields += ",";
    }

    this.#fields += preparedSelect

    return this;
  }

  table(table) {
    return this.from(table);
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

  orderBy(field, order) {
    this.#orders.push({ field, order });

    return this;
  }

  limit(limit, offset) {
    this.#limit = limit;
    this.#offset = offset;

    return this;
  }

  groupBy(field) {
    this.#groupBy = field;

    return this;
  }

  query(sql, append) {
    if (append) {
      this.#query += sql;
    } else {
      this.#query = sql;
    }

    return this;
  }

  update(values, table) {
    table ??= this.#table

    return this.query(`UPDATE ${table} SET ${this.#prepareKeyValues(values)}`);
  }

  async execute(query) {
    return await this
      .query(query ?? this.#query)
      .#setQueryConditions()
      .#execute();
  }

  async create(values, table) {
    table ??= this.#table

    return await this
      .execute(`
        INSERT INTO ${table} (${this.#prepareKeys(values)})
        VALUES (${this.#prepareValues(values)})
      `);
  }

  async find(params) {
    return await this
      .where(this.#getWhere(params))
      .findAll();
  }

  async findAll(where) {
    this.query(`SELECT ${this.#fields ?? "*"} FROM ${this.#table}`);

    if (this.#hasManyJoins.length) {
      for (const join of this.#hasManyJoins) {
        this.query(this.#downJoinQuery(join), true);
      }
    }

    if (this.#belongsToJoins.length) {
      for (const join of this.#belongsToJoins) {
        this.query(this.#joinQuery(join), true);
      }
    }

    this.#setQueryConditions(where);

    if (this.#orders.length) {
      this.query(" ORDER BY", true);
      let orderQueries = [];
      for (const order of this.#orders) {
        orderQueries.push(this.#orderQuery(order));
      }
      this.query(orderQueries.join(","), true);
    }

    return this.#execute();
  }

  async destroy(where, table) {
    table ??= this.#table

    return await this
      .query(`DELETE FROM ${table}`)
      .#setQueryConditions(this.#getWhere(where))
      .execute();
  }
}
