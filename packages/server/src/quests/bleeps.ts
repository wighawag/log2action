import {EventProcessor, IndexingSource, LastSync, LogEvent, UsedStreamConfig} from 'ethereum-indexer';
import {unlessActionAlreadyRecorded} from './utilts.js';

const BleepsABI = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'owner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'approved',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'id',
				type: 'uint256',
			},
		],
		name: 'Approval',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'owner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'operator',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'approved',
				type: 'bool',
			},
		],
		name: 'ApprovalForAll',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'from',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'to',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'id',
				type: 'uint256',
			},
		],
		name: 'Transfer',
		type: 'event',
	},
] as const;

type BleepsQuestsABI = typeof BleepsABI;

class BleepsProcessor implements EventProcessor<BleepsQuestsABI, {}> {
	constructor(
		public source: IndexingSource<BleepsQuestsABI>,
		public db: Storage,
	) {}

	getVersionHash(): string {
		return 'my-processor';
	}
	async load(
		source: IndexingSource<BleepsQuestsABI>,
		streamConfig: UsedStreamConfig,
	): Promise<{state: {}; lastSync: LastSync<BleepsQuestsABI>} | undefined> {
		const lastSync = await this.db.loadLastSync('1');
		return lastSync ? {state: {}, lastSync} : undefined;
	}
	async process(eventStream: LogEvent<BleepsQuestsABI>[], lastSync: LastSync<BleepsQuestsABI>): Promise<{}> {
		for (const logEvent of eventStream) {
			const id = `${logEvent.transactionHash}_${logEvent.logIndex}`;
			await unlessActionAlreadyRecorded(this.db, id, async () => {
				if ('eventName' in logEvent && logEvent.eventName === 'Transfer' && 'args' in logEvent) {
					// TODO typesafe
					const args = logEvent.args as any;
					console.log(args.from);
					return true;
				}
				return false;
			});
		}
		await this.db.saveLastSync('1', lastSync);
		return {};
	}
	async reset(): Promise<void> {}
	async clear(): Promise<void> {}
}

export const BleepsQuests = {
	chainId: '',
	abi: BleepsABI,
	startBlock: 0,
	address: '0x',
	processorFactory: (source: IndexingSource<BleepsQuestsABI>, db: Storage) => new BleepsProcessor(source, db),
} as const;
