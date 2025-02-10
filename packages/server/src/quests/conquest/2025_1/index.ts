import {Abi, IndexingSource} from 'ethereum-indexer';
import {Env} from '../../../env.js';

import OuterSpace from './contracts/OuterSpace.json' with {type: 'json'};
import AllianceRegistry from './contracts/AllianceRegistry.json' with {type: 'json'};
import {ConquestProcessor} from '../quest-processor.js';

export const Conquest_2025_1_Quests = {
	chainId: '100',
	contracts: [
		{
			abi: OuterSpace.abi,
			startBlock: OuterSpace.receipt.blockNumber,
			address: OuterSpace.address,
		},
		{
			abi: AllianceRegistry.abi,
			startBlock: AllianceRegistry.receipt.blockNumber,
			address: AllianceRegistry.address,
		},
	],
	processorFactory: (env: Env, id: string, source: IndexingSource<Abi>, db: Storage) =>
		new ConquestProcessor(env, id, source, db, 'https://api.gg.xyz/api/v2'),
} as const;
