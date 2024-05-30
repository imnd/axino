import mysql from "mysql2/promise";
import pgsql from "pgsql";
import loadEnv from "../load-env.js";

// singleton object
export default class Connection {
  _instance;

  #connection;
  #config;

  constructor() {
    loadEnv();

    this.#config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  async connect() {
    switch (process.env.DB_DIALECT) {
      case "mysql":
        this.#connection = await mysql.createConnection(this.#config);
        break;
      case "pgsql":
        this.#connection = await pgsql.createConnection(this.#config);
        break;
    }
  }

  static getInstance() {
    if (this._instance === undefined) {
      this._instance = new this();
    }

    return this._instance;
  }

  async getConnection() {
    if (this.#connection === undefined) {
      await this.connect();
    }

    return this.#connection;
  }
}

