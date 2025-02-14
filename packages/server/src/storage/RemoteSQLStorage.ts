import {Storage} from './index.js';
import {RemoteSQL} from 'remote-sql';
import setupDB from '../schema/ts/db.sql.js';
import {sqlToStatements} from './utils.js';
import dropTables from '../schema/ts/drop.sql.js';
import {Abi, LastSync} from 'ethereum-indexer';

// TODO have a base utils lib
function bnReplacer(v: any): any {
	if (typeof v === 'bigint') {
		return v.toString() + 'n';
	} else {
		if (typeof v === 'object') {
			if (Array.isArray(v)) {
				return v.map((v) => bnReplacer(v));
			} else {
				const keys = Object.keys(v);
				const n = {};
				for (const key of keys) {
					(n as any)[key] = bnReplacer(v[key]);
				}
				return n;
			}
		} else {
			return v;
		}
	}
}

function bnReviver(v: any): any {
	if (
		typeof v === 'string' &&
		(v.startsWith('-') ? !isNaN(parseInt(v.charAt(1))) : !isNaN(parseInt(v.charAt(0)))) &&
		v.charAt(v.length - 1) === 'n'
	) {
		return BigInt(v.slice(0, -1));
	} else {
		if (typeof v === 'object') {
			if (Array.isArray(v)) {
				return v.map((v) => bnReviver(v));
			} else {
				const keys = Object.keys(v);
				const n = {};
				for (const key of keys) {
					(n as any)[key] = bnReviver(v[key]);
				}
				return n;
			}
		} else {
			return v;
		}
	}
}

export class RemoteSQLStorage implements Storage {
	constructor(private db: RemoteSQL) {}

	async saveLastSync<ABI extends Abi>(questGroupID: string, lastSync: LastSync<ABI>): Promise<void> {
		const sqlStatement = `INSERT INTO SyncingStatus (questGroupID, lastSync) 
		 VALUES(?1, ?2) ON CONFLICT(questGroupID) DO UPDATE SET
		 lastSync=excluded.lastSync;`;
		const statement = this.db.prepare(sqlStatement);
		await statement.bind(questGroupID, JSON.stringify(lastSync, bnReplacer)).all();
	}
	async loadLastSync<ABI extends Abi>(questGroupID: string): Promise<LastSync<ABI> | undefined> {
		const statement = this.db.prepare(`SELECT * FROM SyncingStatus WHERE questGroupID = ?1;`);
		const {results} = await statement.bind(questGroupID).all<{lastSync: string}>();
		if (results.length === 0) {
			return undefined;
		} else {
			return JSON.parse(results[0].lastSync, bnReviver);
		}
	}

	async recordAction(questGroupID: string, actionID: string): Promise<void> {
		const sqlStatement = `INSERT INTO Actions (questGroupID, actionID, timestamp) VALUES(?1, ?2, UNIXEPOCH());`;
		const statement = this.db.prepare(sqlStatement);
		await statement.bind(questGroupID, actionID).all();
	}
	async isActionRecorded(questGroupID: string, actionID: string): Promise<boolean> {
		const statement = this.db.prepare(`SELECT * FROM Actions WHERE questGroupID = ?1 AND actionID = ?2;`);
		const {results} = await statement.bind(questGroupID, actionID).all<{lastSync: string}>();
		if (results.length === 0) {
			return false;
		} else {
			return true;
		}
	}

	async setup() {
		const statements = sqlToStatements(setupDB);
		// The following do not work on bun sqlite:
		//  (seems like prepared statement are partially executed and index cannot be prepared when table is not yet created)
		// await this.db.batch(statements.map((v) => this.db.prepare(v)));
		for (const statement of statements) {
			await this.db.prepare(statement).all();
		}
	}
	async reset() {
		const dropStatements = sqlToStatements(dropTables);
		const statements = sqlToStatements(setupDB);
		const allStatements = dropStatements.concat(statements);
		// The following do not work on bun sqlite:
		//  (seems like prepared statement are partially executed and index cannot be prepared when table is not yet created)
		// await this.db.batch(allStatements.map((v) => this.db.prepare(v)));
		for (const statement of allStatements) {
			await this.db.prepare(statement).all();
		}
	}
}
