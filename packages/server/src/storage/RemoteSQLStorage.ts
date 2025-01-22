import {Storage} from './index.js';
import {RemoteSQL} from 'remote-sql';
import setupDB from '../schema/ts/db.sql.js';
import {sqlToStatements} from './utils.js';
import dropTables from '../schema/ts/drop.sql.js';
import {Abi, LastSync} from 'ethereum-indexer';

export class RemoteSQLStorage implements Storage {
	constructor(private db: RemoteSQL) {}

	async saveLastSync<ABI extends Abi>(id: string, lastSync: LastSync<ABI>): Promise<void> {
		const sqlStatement = `INSERT INTO SyncingStatus (id, lastSync) 
		 VALUES(?1, ?2) ON CONFLICT(id) DO UPDATE SET
		 lastSync=excluded.lastSync;`;
		const statement = this.db.prepare(sqlStatement);
		await statement.bind(id, JSON.stringify(lastSync)).all();
	}
	async loadLastSync<ABI extends Abi>(id: string): Promise<LastSync<ABI> | undefined> {
		const statement = this.db.prepare(`SELECT * FROM SyncingStatus WHERE id = ?1;`);
		const {results} = await statement.bind(id).all<{lastSync: string}>();
		if (results.length === 0) {
			return undefined;
		} else {
			return JSON.parse(results[0].lastSync);
		}
	}

	async recordAction(id: string): Promise<void> {
		const sqlStatement = `INSERT INTO Actions (id, timestamp) VALUES(?1, UNIXEPOCH());`;
		const statement = this.db.prepare(sqlStatement);
		await statement.bind(id).all();
	}
	async isActionRecorded(id: string): Promise<boolean> {
		const statement = this.db.prepare(`SELECT * FROM Actions WHERE id = ?1;`);
		const {results} = await statement.bind(id).all<{lastSync: string}>();
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
