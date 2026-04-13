import BackendDatabase from "better-sqlite3";
import {readFile} from "fs/promises";
import DatabaseHelpers from "./DatabaseHelpers.js";

const database = new BackendDatabase("config/database.db");

let database_structure = (await readFile("variables/structure.sql")).toString();
database.exec(database_structure);

class Database {
	constructor(userid) {
		// The userid here is not used yet, but may be
		// useful in the future for privilege management
		this.userid = userid;
	}
	
	helpers = new DatabaseHelpers(this);
	
	formatQuery(query) {
		let cvarid = 1;
		let variables = {};
		for(let [id, value] of Object.entries(this.tempVars)) {
			if(query.includes(id)) {
				const varid = "sqlitevar"+(cvarid++);
				query = query.replaceAll(id, "@"+varid);
				variables[varid] = value;
				delete this.tempVars[id];
			}
		}
		
		return {query, variables};
	}
	
	_createStatement(query) {
		const formatted = this.formatQuery(query);
		const statement = database.prepare(formatted.query);
		return {
			exec: () => statement.run(formatted.variables),
			get: () => statement.get(formatted.variables),
			all: () => statement.all(formatted.variables)
		};
	}
	
	async exec(query) {
		return this._createStatement(query).exec();
	}
	async get(query) {
		return this._createStatement(query).get();
	}
	async all(query) {
		return this._createStatement(query).all();
	}
	
	tempVars = {};
	val(value) {
		const id = crypto.randomUUID();
		this.tempVars[id] = value;
		return id;
	}
}

export default Database;