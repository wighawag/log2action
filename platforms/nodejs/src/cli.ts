#!/usr/bin/env node
import 'named-logs-context';
import {createServer, type Env} from 'log2action-server';
import {serve} from '@hono/node-server';
import {RemoteLibSQL} from 'remote-sql-libsql';
import {createClient} from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import {Command} from 'commander';
import {loadEnv} from 'ldenv';

const __dirname = import.meta.dirname;

loadEnv({
	defaultEnvFile: path.join(__dirname, '../.env.default'),
});

type NodeJSEnv = Env & {
	DB: string;
};

async function main() {
	const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
	const program = new Command();

	program
		.name('log2action-server-nodejs')
		.version(pkg.version)
		.usage(`log2action-server-nodejs [--port 2000] [--sql <sql-folder>]`)
		.description('run log2action-server-nodejs as a node process')
		.option('-p, --port <port>')
		.option('-q, --quest <questID>', 'quest ID to auto-process')
		.option(
			'-i, --process-interval <interval>',
			'number of seconds between each processQueue/. set it to zero to cancel it',
		)
		.option('--setup');

	program.parse(process.argv);

	type Options = {
		port?: string;
		processInterval?: string;
		setup: boolean;
		quest: string;
	};

	const options: Options = program.opts();
	const port = options.port ? parseInt(options.port) : 2000;
	const processInterval = options.processInterval ? parseInt(options.processInterval) : 300;

	const env = process.env as NodeJSEnv;

	const db = env.DB;
	const TOKEN_ADMIN = (env as any).TOKEN_ADMIN;

	const client = createClient({
		url: db,
	});
	const remoteSQL = new RemoteLibSQL(client);

	const app = createServer({
		getDB: () => remoteSQL,
		getEnv: () => env,
	});

	if (db === ':memory:' || options?.setup) {
		console.log(`executing setup...`);
		await app.fetch(
			new Request('http://localhost/internal/setup?_initDB=true', {
				headers: {
					Authorization: `Basic ${btoa(`admin:${TOKEN_ADMIN}`)}`,
				},
			}),
		);
	}

	if (options.quest) {
		let promise: Promise<Response> | undefined;
		async function processQuest() {
			if (promise) {
				console.log(`still processing previous call...`);
				return;
			}
			console.log(
				`----------------------------------- ${options.quest} -----------------------------------------------`,
			);
			try {
				const res = app.fetch(new Request(`http://localhost/internal/process/${options.quest}`));
				if (res instanceof Promise) {
					promise = res;
				} else {
					promise = Promise.resolve(res);
				}
				await promise;
			} finally {
				promise = undefined;
				console.log(`-----------------------------------------------------------------------------------------`);
			}
		}

		let runningInterval;
		if (processInterval > 0) {
			processQuest();
			runningInterval = setInterval(processQuest, processInterval * 1000);
		}
	}

	serve({
		fetch: app.fetch,
		port,
		hostname: '0.0.0.0',
	});

	console.log(`Server is running on http://0.0.0.0:${port}`);
}
main();
