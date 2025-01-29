import {Hono} from 'hono';
import {ServerOptions} from '../types.js';
import {setup} from '../setup.js';
import {Env} from '../env.js';
import {EthereumIndexer} from 'ethereum-indexer';
import type {Abi} from 'ethereum-indexer';
import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';
import {questsMap} from '../quests/index.js';

type Options = {
	rps?: number;
	nodeUrl: string;
};

export function getInternalAPI(options: ServerOptions) {
	const app = new Hono<{Bindings: Env}>()
		.use(setup({serverOptions: options}))
		.get('/process/:id', async (c) => {
			const id = c.req.param('id');
			const config = c.get('config');
			const env = config.env;
			const storage = config.storage;

			const quests = (questsMap as any)[id];

			const processor = quests.processorFactory(
				env,
				id,
				{
					chainId: quests.chainId,
					contracts: quests.contracts,
				},
				storage,
			);

			// TODO ethereum-indexer-server could reuse
			async function init<ABI extends Abi, ProcessResultType>(options: Options) {
				const eip1193Provider = new JSONRPCHTTPProvider(options.nodeUrl, {requestsPerSecond: options.rps});

				const indexer = new EthereumIndexer(
					eip1193Provider as unknown as EIP1193ProviderWithoutEvents,
					processor,
					processor.source,
					{
						providerSupportsETHBatch: true,
						stream: {
							finality: 12, // TODO
							doNotFetchUnfinalizedLogs: true,
						},
					},
				);

				const lastSync = await indexer.load();
				return {lastSync, indexer, eip1193Provider, processor};
			}

			async function run(options: Options) {
				const timeInMs = Date.now();
				const {indexer, lastSync, eip1193Provider, processor} = await init(options);
				const latestBlockNumberAsHex: string = await eip1193Provider.request({method: 'eth_blockNumber'});
				const lastBlockNumber = parseInt(latestBlockNumberAsHex.slice(2), 16);
				let newLastSync = {...lastSync, latestBlock: lastBlockNumber};
				while (newLastSync.lastToBlock < newLastSync.latestBlock) {
					newLastSync = await indexer.indexMore(); // TODO add option to only sync final state
					const newTimeInMs = Date.now();
					if (newTimeInMs - timeInMs > 25000) {
						break;
					}
				}
			}

			const nodeURL = (env as any)[`CHAIN_${quests.chainId}`];
			const options = {nodeUrl: nodeURL};
			await init(options);
			await run(options);
			return c.json({success: true, state: processor.state});
		})
		.get('/setup', async (c) => {
			return c.json({success: true});
		});

	return app;
}
