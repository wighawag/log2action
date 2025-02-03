import {Abi, IndexingSource} from 'ethereum-indexer';
import {Env} from '../../../env.js';

import OuterSpace from './contracts/OuterSpace.json' with {type: 'json'};
import Yakuza from './contracts/Yakuza.json' with {type: 'json'};
import AllianceRegistry from './contracts/AllianceRegistry.json' with {type: 'json'};
import {ConquestProcessor} from '../quest-processor.js';

export const ConquestTestQuests = {
	chainId: '100',
	contracts: [
		{
			abi: OuterSpace.abi,
			startBlock: OuterSpace.receipt.blockNumber,
			address: OuterSpace.address,
		},
		{
			abi: Yakuza.abi,
			startBlock: Yakuza.receipt.blockNumber,
			address: Yakuza.address,
		},
		{
			abi: AllianceRegistry.abi,
			startBlock: AllianceRegistry.receipt.blockNumber,
			address: AllianceRegistry.address,
		},
	],
	processorFactory: (env: Env, id: string, source: IndexingSource<Abi>, db: Storage) =>
		new ConquestProcessor(env, id, source, db),
} as const;
