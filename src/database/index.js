import {
	ServerSchema,
	SettingsSchema,
	UserSchema,
} from "#database/schema/index";
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Delay invocation until `ms` ms have elapsed since the last call.
 * @param {Function} fn
 * @param {number} [ms=250]
 * @returns {Function & { flush: () => void }}
 */
function debounce(fn, ms = 250) {
	let t = null;
	const wrapped = () => {
		if (t) clearTimeout(t);
		t = setTimeout(() => {
			t = null;
			fn();
		}, ms);
	};
	wrapped.flush = () => {
		if (t) {
			clearTimeout(t);
			t = null;
			fn();
		}
	};
	return wrapped;
}

/** @type {Set<Function>} */
const _flushers = new Set();

process.once("beforeExit", () => {
	for (const f of _flushers) {
		try {
			f();
		} catch {}
	}
});
process.once("SIGINT", () => {
	for (const f of _flushers) {
		try {
			f();
		} catch {}
	}
	process.exit(0);
});
process.once("SIGTERM", () => {
	for (const f of _flushers) {
		try {
			f();
		} catch {}
	}
	process.exit(0);
});

/**
 * Fill missing fields in `data` using `schema` defaults.
 * @param {object} schema
 * @param {object} [data={}]
 * @returns {object}
 */
function applySchema(schema, data = {}) {
	const result = { ...data };
	for (const [k, v] of Object.entries(schema)) {
		if (!(k in result)) result[k] = typeof v === "function" ? v() : v;
	}
	return result;
}

class JsonCollection {
	/**
	 * @param {{ data: object, schema: object, flush: Function }} opts
	 */
	constructor({ data, schema, flush }) {
		this._data = data;
		this._schema = schema;
		this._flush = flush;
	}

	/**
	 * @param {string} key
	 * @returns {object|null}
	 */
	get(key) {
		return this._data[key] ?? null;
	}

	/**
	 * Upsert an entry, merging `partial` into the schema-initialized record.
	 * @param {string} key
	 * @param {object} [partial={}]
	 * @returns {object}
	 */
	set(key, partial = {}) {
		if (!this._data[key]) this._data[key] = applySchema(this._schema);
		if (partial && typeof partial === "object")
			Object.assign(this._data[key], partial);
		this._flush();
		return this._data[key];
	}

	/** @param {string} key */
	delete(key) {
		delete this._data[key];
		this._flush();
	}

	/** @returns {object} */
	all() {
		return { ...this._data };
	}
}

class JsonDB {
	#path;
	#data;
	#write;

	constructor() {
		this.#path = process.env.DB_JSON_PATH ?? "./data/database.json";
		const dir = dirname(this.#path);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

		try {
			this.#data = existsSync(this.#path)
				? JSON.parse(readFileSync(this.#path, "utf-8"))
				: { users: {}, servers: {}, settings: {} };
		} catch {
			this.#data = { users: {}, servers: {}, settings: {} };
		}

		this.#data.users ??= {};
		this.#data.servers ??= {};
		this.#data.settings ??= {};

		this.#write = debounce(() => this._flush(), 300);
		_flushers.add(this.#write.flush);

		const flush = () => this.#write();
		this.users = new JsonCollection({
			data: this.#data.users,
			schema: UserSchema,
			flush,
		});
		this.servers = new JsonCollection({
			data: this.#data.servers,
			schema: ServerSchema,
			flush,
		});
		this.settings = new JsonCollection({
			data: this.#data.settings,
			schema: SettingsSchema,
			flush,
		});
	}

	/** @private */
	_flush() {
		try {
			writeFileSync(this.#path, JSON.stringify(this.#data, null, 2));
		} catch (err) {
			console.error("[DB] JSON write failed:", err.message);
		}
	}

	save() {
		this.#write.flush();
	}

	/** @param {number} [interval=10_000] */
	savePeriodically(interval = 10_000) {
		setInterval(() => this.save(), interval);
	}

	async initialize() {}
}

/** @type {import('better-sqlite3').Database|null} */
let _sqlite = null;

function getSqlite() {
	if (_sqlite) return _sqlite;

	const dbPath = process.env.DB_PATH ?? "./data/mochi.db";
	const dir = dirname(dbPath);
	if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

	_sqlite = new Database(dbPath);
	_sqlite.pragma("journal_mode = WAL");
	_sqlite.pragma("synchronous = NORMAL");
	_sqlite.pragma("temp_store = MEMORY");
	_sqlite.pragma("mmap_size = 30000000");

	_sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users    (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS servers  (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  `);

	process.once("beforeExit", () => {
		try {
			_sqlite.close();
		} catch {}
	});
	return _sqlite;
}

/**
 * SQLite collection with proper read-modify-write on every set.
 * Never mutate the returned object — call set() again with a partial update.
 */
class SqliteCollection {
	/**
	 * @param {string} table
	 * @param {object} schema
	 */
	constructor(table, schema) {
		this._db = getSqlite();
		this._schema = schema;
		this._get = this._db.prepare(`SELECT data FROM ${table} WHERE id = ?`);
		this._upsert = this._db.prepare(
			`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`
		);
		this._del = this._db.prepare(`DELETE FROM ${table} WHERE id = ?`);
		this._all = this._db.prepare(`SELECT id, data FROM ${table}`);
	}

	/** @private */
	_parse(row) {
		if (!row) return null;
		try {
			return JSON.parse(row.data);
		} catch {
			return null;
		}
	}

	/**
	 * @param {string} id
	 * @returns {object|null}
	 */
	get(id) {
		return this._parse(this._get.get(id));
	}

	/**
	 * Upsert an entry: reads existing row, applies schema defaults, merges
	 * `partial`, then writes back atomically. Safe for nested object mutation.
	 * @param {string} id
	 * @param {object} [partial={}]
	 * @returns {object}
	 */
	set(id, partial = {}) {
		const existing = this.get(id) ?? applySchema(this._schema);
		const merged = applySchema(this._schema, existing);
		if (partial && typeof partial === "object") {
			for (const [k, v] of Object.entries(partial)) {
				if (
					v !== null &&
					typeof v === "object" &&
					!Array.isArray(v) &&
					typeof merged[k] === "object" &&
					merged[k] !== null
				) {
					merged[k] = { ...merged[k], ...v };
				} else {
					merged[k] = v;
				}
			}
		}
		this._upsert.run(id, JSON.stringify(merged));
		return merged;
	}

	/** @param {string} id */
	delete(id) {
		this._del.run(id);
	}

	/**
	 * @returns {object} All entries keyed by id.
	 */
	all() {
		const result = {};
		for (const row of this._all.all()) {
			const parsed = this._parse(row);
			if (parsed) result[row.id] = parsed;
		}
		return result;
	}
}

class SqliteDB {
	constructor() {
		this.users = new SqliteCollection("users", UserSchema);
		this.servers = new SqliteCollection("servers", ServerSchema);
		this.settings = new SqliteCollection("settings", SettingsSchema);
	}

	save() {}
	savePeriodically() {}
	async initialize() {}
}

/**
 * Create the database backend from DB_TYPE env (default: sqlite).
 * @returns {JsonDB|SqliteDB}
 */
function createDB() {
	return (process.env.DB_TYPE ?? "sqlite").toLowerCase() === "json"
		? new JsonDB()
		: new SqliteDB();
}

const db = createDB();
export default db;
