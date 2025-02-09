import 'named-logs-context';
import { WorkerEnv } from '../env';
import { logs } from 'named-logs';
import { track, enable as enableWorkersLogger } from 'workers-logger';
import { logflareReport } from './logflare.js';
import { consoleReporter } from './basicReporters.js';
enableWorkersLogger('*');
const logger = logs('worker');

export async function wrapWithLogger(
	request: Request,
	env: WorkerEnv,
	ctx: ExecutionContext,
	callback: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>,
): Promise<Response> {
	const namespaces = env.NAMED_LOGS || '*';
	let logLevel = 2;
	if (env.NAMED_LOGS || env.NAMED_LOGS_LEVEL) {
		if (env.NAMED_LOGS_LEVEL) {
			const level = parseInt(env.NAMED_LOGS_LEVEL);
			if (!isNaN(level)) {
				logLevel = level;
			}
		}
	}
	if ((globalThis as any)._logFactory) {
		(globalThis as any)._logFactory.enable(namespaces);
		(globalThis as any)._logFactory.level = logLevel;
	} else {
		console.error(`no log factory`);
	}

	const _trackLogger = track(
		request,
		'LOG2ACTION',
		env.LOGFLARE_API_KEY && env.LOGFLARE_SOURCE
			? logflareReport({ apiKey: env.LOGFLARE_API_KEY, source: env.LOGFLARE_SOURCE })
			: consoleReporter,
	);
	// const trackLogger = new Proxy(_trackLogger, {
	// 	get(t, p) {
	// 		return (...args: any[]) => {
	// 			if (p === 'log' || p === 'error' || p === 'info') {
	// 				console[p](...args);
	// 			}
	// 			(_trackLogger as any)[p](...args);
	// 		};
	// 	},
	// });
	const response = await (globalThis as any)._runWithLogger(_trackLogger, () => {
		return callback(request, env, ctx).catch((err) => {
			return new Response(err, {
				status: 500,
				statusText: err.message,
			});
		});
	});
	const p = _trackLogger.report(response || new Response('Scheduled Action Done'));
	if (p) {
		ctx.waitUntil(p);
	}
	return response;
}
