import {
  ServerSchema,
  SettingsSchema,
  UserSchema,
} from "#database/schema/index";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

class Helper {
  constructor(name, data, schema) {
    this.name = name;
    this._data = data ?? {};
    this.schema = schema;
  }

  get(key) {
    return this._data[key] ?? null;
  }

  set(key, value) {
    if (!this._data[key]) {
      this._data[key] = {};
      for (const k in this.schema) {
        this._data[key][k] =
          typeof this.schema[k] === "function"
            ? this.schema[k]()
            : this.schema[k];
      }
    }
    if (value && typeof value === "object") {
      Object.assign(this._data[key], value);
    }
    return this._data[key];
  }

  delete(key) {
    delete this._data[key];
  }

  all() {
    return { ...this._data };
  }
}

class MochiDB {
  #initialized = false;
  #path = process.env.DATABASE_LOCAL_PATH ?? "./sessions/database.json";
  #data = {
    users: {},
    servers: {},
    settings: {},
  };

  constructor() {
    // Auto-create folders and files when first imported
    const dir = dirname(this.#path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (!existsSync(this.#path)) {
      writeFileSync(this.#path, JSON.stringify(this.#data, null, 2));
    }

    this.users = new Helper("users", this.#data.users, UserSchema);
    this.servers = new Helper("servers", this.#data.servers, ServerSchema);
    this.settings = new Helper("settings", this.#data.settings, SettingsSchema);
  }

  async initialize() {
    if (this.#initialized) {
      return;
    }
    try {
      const content = readFileSync(this.#path, "utf-8");
      this.#data = JSON.parse(content);
    } catch {
      this.#data = {
        users: {},
        servers: {},
        settings: {},
      };
    }
    this.users = new Helper("users", this.#data.users, UserSchema);
    this.servers = new Helper("servers", this.#data.servers, ServerSchema);
    this.settings = new Helper("settings", this.#data.settings, SettingsSchema);
    this.#initialized = true;
  }

  save() {
    writeFileSync(this.#path, JSON.stringify(this.#data, null, 2));
  }

  savePeriodically(interval = 10_000) {
    setInterval(() => this.save(), interval);
  }
}

const db = new MochiDB();
export default db;
