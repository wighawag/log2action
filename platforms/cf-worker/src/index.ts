import { createServer } from 'log2action-server';
import { RemoteD1 } from 'remote-sql-d1';
import { wrapWithLogger } from './logging';
import { WorkerEnv } from './env';

export const app = createServer({
	getDB: (c) => new RemoteD1((c.env as unknown as WorkerEnv).DB),
	getEnv: (c) => c.env,
});

const fetch = async (request: Request, env: WorkerEnv, ctx: ExecutionContext) => {
	return wrapWithLogger(request, env, ctx, async () => app.fetch(request, env, ctx));
};

export default {
	fetch,
	// // @ts-expect-error TS6133
	// async scheduled(event, env, ctx) {
	// 	ctx.waitUntil(() => {
	// 		console.log(`scheduled`);
	// 	});
	// },
};
