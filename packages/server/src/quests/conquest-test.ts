import {EventProcessor, IndexingSource, LastSync, LogEvent, UsedStreamConfig} from 'ethereum-indexer';
import {unlessActionAlreadyRecorded} from './utilts.js';
import {GG} from '../gg/index.js';
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

type State = {
	planets: {[location: string]: {active: boolean; stake: string}};
	totalStaked: {[player: string]: {current: string; previous: string}};
	totalSpaceshipsSent: {[player: string]: {current: number; previous: number}};
	totalPlanetsStaked: {[player: string]: {current: number; previous: number}};
	totalStakeCaptured: {[player: string]: {current: string; previous: string}};
	totalPlanetsCaptured: {[player: string]: {current: number; previous: number}};
};

class Processor implements EventProcessor<MyABI, {}> {
	public gg: GG;
	public state: State;

	constructor(
		public env: Env,
		public questGroupID: string,
		public source: IndexingSource<MyABI>,
		public db: Storage,
	) {
		this.gg = new GG(env);
		this.state = {
			planets: {},
			totalStaked: {},
			totalSpaceshipsSent: {},
			totalStakeCaptured: {},
			totalPlanetsCaptured: {},
			totalPlanetsStaked: {},
		};
	}

	getVersionHash(): string {
		return 'my-processor';
	}
	async load(
		source: IndexingSource<MyABI>,
		streamConfig: UsedStreamConfig,
	): Promise<{state: State; lastSync: LastSync<MyABI>} | undefined> {
		// We are not loading so we always start from beginning to solve gg.xyz issue of not taking into consideration action when account is not already existing
		const lastSync = undefined; //await this.db.loadLastSync(this.questGroupID);

		return lastSync
			? {
					state: {
						planets: {},
						totalStaked: {},
						totalSpaceshipsSent: {},
						totalStakeCaptured: {},
						totalPlanetsCaptured: {},
						totalPlanetsStaked: {},
					},
					lastSync,
				}
			: undefined;
	}

	// async ensureProfileExist(playerAddress: string, func: () => Promise<boolean>): Promise<boolean> {
	// 	const hasProfile = await this.gg.hasGGProfile(playerAddress);

	// 	if (!hasProfile) {
	// 		console.log(`no GG profile for ${playerAddress}`);
	// 		return false;
	// 	}
	// 	return func();
	// }

	async testAndFulfillQuest(playerAddress: string, actions: string[], test?: () => Promise<boolean>): Promise<boolean> {
		const hasProfile = await this.gg.hasGGProfile(playerAddress);

		if (!hasProfile) {
			console.log(`no GG profile for ${playerAddress}`);
			return false;
		}

		if (!test || (await test())) {
			const result = await this.gg.fullfillQuest({
				actions,
				playerAddress,
			});
			console.log(result);
			const {status} = result;
			console.log({status, playerAddress});
			return status === 'success';
		} else {
			console.log(`do not apply`);
			return true;
		}
	}

	async process(eventStream: LogEvent<MyABI>[], lastSync: LastSync<MyABI>): Promise<{}> {
		for (const logEvent of eventStream) {
			const actionID = `${logEvent.transactionHash}_${logEvent.logIndex}`;
			if ('eventName' in logEvent && logEvent.eventName === 'PlanetStake' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const playerAddress = args.acquirer.toLowerCase();
				const planetLocation = args.location.toLowerCase();
				const totalStaked = (this.state.totalStaked[playerAddress] = this.state.totalStaked[playerAddress] || {
					current: '0',
					previous: '0',
				});
				totalStaked.previous = totalStaked.current;
				totalStaked.current = (BigInt(totalStaked.current || '0') + BigInt(args.stake)).toString();

				const totalPlanetsStaked = (this.state.totalPlanetsStaked[playerAddress] = this.state.totalPlanetsStaked[
					playerAddress
				] || {
					current: 0,
					previous: 0,
				});
				totalPlanetsStaked.previous = totalPlanetsStaked.current;
				totalPlanetsStaked.current = totalPlanetsStaked.current + 1;

				const planet = (this.state.planets[planetLocation] = this.state.planets[planetLocation] || {
					active: false,
					stake: '0',
				});
				planet.active = true;
				planet.stake = BigInt(args.stake).toString();
			} else if ('eventName' in logEvent && logEvent.eventName === 'ExitComplete' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const planetLocation = args.location.toLowerCase();
				const planet = (this.state.planets[planetLocation] = this.state.planets[planetLocation] || {
					active: false,
					stake: '0',
				});
				planet.active = false;
				// console.log(`planet exited: ${planetLocation}`);
			} else if ('eventName' in logEvent && logEvent.eventName === 'FleetSent' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const playerAddress = args.fleetSender.toLowerCase();
				const totalSpaceshipsSent = (this.state.totalSpaceshipsSent[playerAddress] = this.state.totalSpaceshipsSent[
					playerAddress
				] || {
					current: 0,
					previous: 0,
				});
				totalSpaceshipsSent.previous = totalSpaceshipsSent.current;
				totalSpaceshipsSent.current = totalSpaceshipsSent.current + args.quantity;
			} else if ('eventName' in logEvent && logEvent.eventName === 'FleetArrived' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const playerAddress = args.fleetOwner.toLowerCase();
				const destination = args.destination.toLowerCase();
				const planet = this.state.planets[destination];
				if (args.won && planet?.active) {
					const totalCaptured = (this.state.totalStakeCaptured[playerAddress] = this.state.totalStakeCaptured[
						playerAddress
					] || {
						current: '0',
						previous: '0',
					});
					totalCaptured.previous = totalCaptured.current;
					totalCaptured.current = (BigInt(totalCaptured.current || '0') + BigInt(planet.stake)).toString();

					const totalPlanetsCaptured = (this.state.totalPlanetsCaptured[playerAddress] = this.state
						.totalPlanetsCaptured[playerAddress] || {
						current: 0,
						previous: 0,
					});
					totalPlanetsCaptured.previous = totalPlanetsCaptured.current;
					totalPlanetsCaptured.current = totalPlanetsCaptured.current + 1;
				}
			}
			await unlessActionAlreadyRecorded(this.db, this.questGroupID, actionID, async () => {
				// TODO typesafe
				if ('eventName' in logEvent && logEvent.eventName === 'PlanetStake' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.acquirer.toLowerCase();
					const actionsTriggered: string[] = ['1 Planet Staked'];

					if (actionsTriggered.length > 0) {
						return this.testAndFulfillQuest(playerAddress, actionsTriggered);
					}
					return false;
				} else if ('eventName' in logEvent && logEvent.eventName === 'FleetSent' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.fleetSender.toLowerCase();
					const totalSpaceshipsSent = this.state.totalSpaceshipsSent[playerAddress];
					const actionsTriggered: string[] = [];
					if (totalSpaceshipsSent.current < 100_000 && totalSpaceshipsSent.current >= 100_000) {
						actionsTriggered.push('100,000 spaceships sent');
					}
					if (totalSpaceshipsSent.current < 1_000_000 && totalSpaceshipsSent.current >= 1_000_000) {
						actionsTriggered.push('1,000,000 spaceships sent');
					}
					if (totalSpaceshipsSent.current < 10_000_000 && totalSpaceshipsSent.current >= 10_000_000) {
						actionsTriggered.push('10,000,000 spaceships sent');
					}
					if (actionsTriggered.length > 0) {
						return this.testAndFulfillQuest(playerAddress, actionsTriggered);
					}
					return false;
				} else if ('eventName' in logEvent && logEvent.eventName === 'FleetArrived' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.fleetOwner.toLowerCase();
					const destination = args.destination.toLowerCase();
					const planet = this.state.planets[destination];
					if (args.won && planet?.active) {
						const actionsTriggered: string[] = ['1 Planet Captured'];

						if (actionsTriggered.length > 0) {
							return this.testAndFulfillQuest(playerAddress, actionsTriggered);
						}
					} else {
						// return this.testAndFulfillQuest(playerAddress, [`Fleet Conquered ab inactive planet ${args.destination}`]);
						return false; // TODO true if we want to block
					}
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
			startBlock: 38273694,
			address: '0xEd16fDb2191C56094911675DE634c1af36f8e9AB',
		},
	],
	processorFactory: (env: Env, id: string, source: IndexingSource<MyABI>, db: Storage) =>
		new Processor(env, id, source, db),
} as const;
