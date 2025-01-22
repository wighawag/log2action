import {EventProcessor, IndexingSource, LastSync, LogEvent, UsedStreamConfig} from 'ethereum-indexer';
import {unlessActionAlreadyRecorded} from './utilts.js';
import {fullfillQuest} from '../gg/index.js';
import {Env} from '../env.js';

const abi = [
	{
		inputs: [
			{
				internalType: 'address',
				name: '_contractOwner',
				type: 'address',
			},
			{
				components: [
					{
						internalType: 'address',
						name: 'facetAddress',
						type: 'address',
					},
					{
						internalType: 'enum IDiamondCut.FacetCutAction',
						name: 'action',
						type: 'uint8',
					},
					{
						internalType: 'bytes4[]',
						name: 'functionSelectors',
						type: 'bytes4[]',
					},
				],
				internalType: 'struct IDiamondCut.FacetCut[]',
				name: '_diamondCut',
				type: 'tuple[]',
			},
			{
				components: [
					{
						internalType: 'address',
						name: 'initContract',
						type: 'address',
					},
					{
						internalType: 'bytes',
						name: 'initData',
						type: 'bytes',
					},
				],
				internalType: 'struct Diamond.Initialization[]',
				name: '_initializations',
				type: 'tuple[]',
			},
		],
		stateMutability: 'payable',
		type: 'constructor',
	},
	{
		stateMutability: 'payable',
		type: 'fallback',
	},
	{
		stateMutability: 'payable',
		type: 'receive',
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
				indexed: false,
				internalType: 'uint256',
				name: 'block',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'timestamp',
				type: 'uint256',
			},
		],
		name: 'BlockTime',
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
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'stake',
				type: 'uint256',
			},
		],
		name: 'ExitComplete',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'uint256',
				name: 'fleet',
				type: 'uint256',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'fleetOwner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'destinationOwner',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'destination',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'gift',
				type: 'bool',
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'won',
				type: 'bool',
			},
			{
				components: [
					{
						internalType: 'uint32',
						name: 'newNumspaceships',
						type: 'uint32',
					},
					{
						internalType: 'int40',
						name: 'newTravelingUpkeep',
						type: 'int40',
					},
					{
						internalType: 'uint32',
						name: 'newOverflow',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'numSpaceshipsAtArrival',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'taxLoss',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'fleetLoss',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'planetLoss',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'inFlightFleetLoss',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'inFlightPlanetLoss',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'accumulatedDefenseAdded',
						type: 'uint32',
					},
					{
						internalType: 'uint32',
						name: 'accumulatedAttackAdded',
						type: 'uint32',
					},
				],
				indexed: false,
				internalType: 'struct ImportingOuterSpaceEvents.ArrivalData',
				name: 'data',
				type: 'tuple',
			},
		],
		name: 'FleetArrived',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'fleetSender',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'fleetOwner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'from',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'address',
				name: 'operator',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'fleet',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'quantity',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newNumSpaceships',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'int40',
				name: 'newTravelingUpkeep',
				type: 'int40',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newOverflow',
				type: 'uint32',
			},
		],
		name: 'FleetSent',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'address',
				name: 'newGeneratorAdmin',
				type: 'address',
			},
		],
		name: 'GeneratorAdminChanged',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'address',
				name: 'newGenerator',
				type: 'address',
			},
		],
		name: 'GeneratorChanged',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'bytes32',
				name: 'genesis',
				type: 'bytes32',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'resolveWindow',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'timePerDistance',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'exitDuration',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'acquireNumSpaceships',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'productionSpeedUp',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'frontrunningDelay',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'productionCapAsDuration',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'upkeepProductionDecreaseRatePer10000th',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'fleetSizeFactor6',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'initialSpaceExpansion',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'expansionDelta',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'giftTaxPer10000',
				type: 'uint256',
			},
		],
		name: 'Initialized',
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
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
		],
		name: 'PlanetExit',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
		],
		name: 'PlanetReset',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'acquirer',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'numSpaceships',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'int40',
				name: 'travelingUpkeep',
				type: 'int40',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'overflow',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'stake',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'freegift',
				type: 'bool',
			},
		],
		name: 'PlanetStake',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'previousOwner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'newOwner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newNumspaceships',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'int40',
				name: 'newTravelingUpkeep',
				type: 'int40',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newOverflow',
				type: 'uint32',
			},
		],
		name: 'PlanetTransfer',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'giver',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'rewardId',
				type: 'uint256',
			},
		],
		name: 'RewardSetup',
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
				internalType: 'uint256',
				name: 'location',
				type: 'uint256',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'rewardId',
				type: 'uint256',
			},
		],
		name: 'RewardToWithdraw',
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
				indexed: false,
				internalType: 'uint256',
				name: 'newStake',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'freegift',
				type: 'bool',
			},
		],
		name: 'StakeToWithdraw',
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
				name: 'location',
				type: 'uint256',
			},
		],
		name: 'Transfer',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'uint256',
				name: 'origin',
				type: 'uint256',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'fleet',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newNumspaceships',
				type: 'uint32',
			},
			{
				indexed: false,
				internalType: 'int40',
				name: 'newTravelingUpkeep',
				type: 'int40',
			},
			{
				indexed: false,
				internalType: 'uint32',
				name: 'newOverflow',
				type: 'uint32',
			},
		],
		name: 'TravelingUpkeepRefund',
		type: 'event',
	},
] as const;

type MyABI = typeof abi;

class Processor implements EventProcessor<MyABI, {}> {
	constructor(
		public env: Env,
		public questGroupID: string,
		public source: IndexingSource<MyABI>,
		public db: Storage,
	) {}

	getVersionHash(): string {
		return 'my-processor';
	}
	async load(
		source: IndexingSource<MyABI>,
		streamConfig: UsedStreamConfig,
	): Promise<{state: {}; lastSync: LastSync<MyABI>} | undefined> {
		const lastSync = await this.db.loadLastSync(this.questGroupID);
		// TODO if we remove this, we can track even for account who did not register with gg.xyz
		// but this might be too much to index at some point
		return lastSync ? {state: {}, lastSync} : undefined;
	}
	async process(eventStream: LogEvent<MyABI>[], lastSync: LastSync<MyABI>): Promise<{}> {
		for (const logEvent of eventStream) {
			const actionID = `${logEvent.transactionHash}_${logEvent.logIndex}`;
			await unlessActionAlreadyRecorded(this.db, this.questGroupID, actionID, async () => {
				// TODO typesafe
				if ('eventName' in logEvent && logEvent.eventName === 'PlanetStake' && 'args' in logEvent) {
					const args = logEvent.args as any;
					console.log(args.acquirer);
					await fullfillQuest(this.env, {
						actions: ['Kill zombie'],
						playerAddress: args.acquirer,
					});
					return true;
				}
				return false;
			});
		}
		await this.db.saveLastSync(this.questGroupID, lastSync);
		return {};
	}
	async reset(): Promise<void> {}
	async clear(): Promise<void> {}
}

export const ConquestTestQuests = {
	chainId: '100',
	contracts: [
		{
			abi,
			startBlock: 38138325,
			address: '0xb63b48B6Ad0150B1Bd014495e53CfbF8a27bd228',
		},
	],
	processorFactory: (env: Env, id: string, source: IndexingSource<MyABI>, db: Storage) =>
		new Processor(env, id, source, db),
} as const;
