import {Abi, EventProcessor, IndexingSource, LastSync, LogEvent, UsedStreamConfig} from 'ethereum-indexer';
import {unlessActionAlreadyRecorded} from '../utilts.js';
import {GG} from '../../gg/index.js';
import {Env} from '../../env.js';

type State = {
	planets: {[location: string]: {active: boolean; stake: string}};
	totalStaked: {[player: string]: {current: string; previous: string}};
	totalSpaceshipsSent: {[player: string]: {current: number; previous: number}};
	totalPlanetsStaked: {[player: string]: {current: number; previous: number}};
	totalStakeCaptured: {[player: string]: {current: string; previous: string}};
	totalPlanetsCaptured: {[player: string]: {current: number; previous: number}};
	totalContributionToYakuza: {[player: string]: {current: string; previous: string}};
	fleetRevengesClaimed: {[fleet: string]: {current: boolean; previous: boolean}};
};

export class ConquestProcessor implements EventProcessor<Abi, {}> {
	public gg: GG;
	public state: State;

	constructor(
		public env: Env,
		public questGroupID: string,
		public source: IndexingSource<Abi>,
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
			totalContributionToYakuza: {},
			fleetRevengesClaimed: {},
		};
	}

	getVersionHash(): string {
		return 'my-processor';
	}
	async load(
		source: IndexingSource<Abi>,
		streamConfig: UsedStreamConfig,
	): Promise<{state: State; lastSync: LastSync<Abi>} | undefined> {
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
						totalContributionToYakuza: {},
						fleetRevengesClaimed: {},
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

	async process(eventStream: LogEvent<Abi>[], lastSync: LastSync<Abi>): Promise<{}> {
		for (const logEvent of eventStream) {
			const actionID = `${logEvent.transactionHash}_${logEvent.logIndex}`;
			if ('eventName' in logEvent && logEvent.eventName === 'ExitComplete' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const planetLocation = args.location.toString();
				const planet = (this.state.planets[planetLocation] = this.state.planets[planetLocation] || {
					active: false,
					stake: '0',
				});
				planet.active = false;
				// console.log(`planet exited: ${planetLocation}`);
			} else if ('eventName' in logEvent && logEvent.eventName === 'PlanetStake' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const playerAddress = args.acquirer.toLowerCase();
				const planetLocation = args.location.toString();
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
				const destination = args.destination.toString();
				const planet = this.state.planets[destination];
				if (args.won && planet?.active) {
					const totalStakeCaptured = (this.state.totalStakeCaptured[playerAddress] = this.state.totalStakeCaptured[
						playerAddress
					] || {
						current: '0',
						previous: '0',
					});
					totalStakeCaptured.previous = totalStakeCaptured.current;
					totalStakeCaptured.current = (BigInt(totalStakeCaptured.current || '0') + BigInt(planet.stake)).toString();

					const totalPlanetsCaptured = (this.state.totalPlanetsCaptured[playerAddress] = this.state
						.totalPlanetsCaptured[playerAddress] || {
						current: 0,
						previous: 0,
					});
					totalPlanetsCaptured.previous = totalPlanetsCaptured.current;
					totalPlanetsCaptured.current = totalPlanetsCaptured.current + 1;
				}
			} else if ('eventName' in logEvent && logEvent.eventName === 'YakuzaSubscribed' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const playerAddress = args.subscriber.toLowerCase();
				const contribution = args.contribution;
				const totalContributionToYakuza = (this.state.totalContributionToYakuza[playerAddress] = this.state
					.totalContributionToYakuza[playerAddress] || {
					current: '0',
					previous: '0',
				});
				totalContributionToYakuza.previous = totalContributionToYakuza.current;
				totalContributionToYakuza.current = (
					BigInt(totalContributionToYakuza.current || '0') + BigInt(contribution)
				).toString();
			} else if ('eventName' in logEvent && logEvent.eventName === 'YakuzaClaimed' && 'args' in logEvent) {
				const args = logEvent.args as any;
				const fleetId = args.fleetId.toString();
				const fleetRevengesClaimed = (this.state.fleetRevengesClaimed[fleetId] = this.state.fleetRevengesClaimed[
					fleetId
				] || {
					current: false,
					previous: false,
				});
				fleetRevengesClaimed.previous = fleetRevengesClaimed.current;
				fleetRevengesClaimed.current = true;
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
				} else if ('eventName' in logEvent && logEvent.eventName === 'FleetSent' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.fleetSender.toLowerCase();
					const totalSpaceshipsSent = this.state.totalSpaceshipsSent[playerAddress];
					const actionsTriggered: string[] = [];

					const thresholdData = [
						{threshold: 100_000, maxTrigger: 1_000_000, action: '100,000 spaceships sent'},
						{threshold: 1_000_000, maxTrigger: 10_000_000, action: '1,000,000 spaceships sent'},
						{threshold: 10_000_000, maxTrigger: 100_000_000, action: '10,000,000 spaceships sent'},
					];

					for (const {threshold, maxTrigger, action} of thresholdData) {
						const previousCrossings = Math.min(
							Math.floor(totalSpaceshipsSent.previous / threshold),
							Math.floor(maxTrigger / threshold),
						);
						const currentCrossings = Math.min(
							Math.floor(totalSpaceshipsSent.current / threshold),
							Math.floor(maxTrigger / threshold),
						);

						if (currentCrossings > previousCrossings) {
							const timesCrossed = currentCrossings - previousCrossings;
							for (let i = 0; i < timesCrossed; i++) {
								actionsTriggered.push(action);
							}
						}
					}
					if (actionsTriggered.length > 0) {
						return this.testAndFulfillQuest(playerAddress, actionsTriggered);
					}
				} else if ('eventName' in logEvent && logEvent.eventName === 'FleetArrived' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.fleetOwner.toLowerCase();
					const destination = args.destination.toString();
					const planet = this.state.planets[destination];
					if (args.won && planet?.active) {
						const actionsTriggered: string[] = ['1 Planet Captured'];

						if (actionsTriggered.length > 0) {
							return this.testAndFulfillQuest(playerAddress, actionsTriggered);
						}
					}
				} else if ('eventName' in logEvent && logEvent.eventName === 'YakuzaSubscribed' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.subscriber.toLowerCase();
					const actionsTriggered: string[] = [];
					const totalContributionToYakuza = this.state.totalContributionToYakuza[playerAddress];

					const thresholdData = [
						{
							threshold: BigInt('1000000000000000000'),
							maxTrigger: BigInt('2000000000000000000'),
							action: 'Subscribed to Yakuza for 1$',
						},
						{
							threshold: BigInt('2000000000000000000'),
							maxTrigger: BigInt('6000000000000000000'),
							action: 'Subscribed to Yakuza for 2$',
						},
						{
							threshold: BigInt('6000000000000000000'),
							maxTrigger: BigInt('12000000000000000000'),
							action: 'Subscribed to Yakuza for 6$',
						},
						{
							threshold: BigInt('12000000000000000000'),
							maxTrigger: BigInt('24000000000000000000'),
							action: 'Subscribed to Yakuza for 12$',
						},
					];

					for (const {threshold, maxTrigger, action} of thresholdData) {
						const previousCrossings = BigInt(
							Math.min(Number(BigInt(totalContributionToYakuza.previous) / threshold), Number(maxTrigger)),
						);
						const currentCrossings = BigInt(
							Math.min(Number(BigInt(totalContributionToYakuza.current) / threshold), Number(maxTrigger)),
						);

						if (currentCrossings > previousCrossings) {
							const timesCrossed = currentCrossings - previousCrossings;
							for (let i = 0n; i < timesCrossed; i++) {
								actionsTriggered.push(action);
							}
						}
					}
					if (actionsTriggered.length > 0) {
						return this.testAndFulfillQuest(playerAddress, actionsTriggered);
					}
				} else if ('eventName' in logEvent && logEvent.eventName === 'YakuzaClaimed' && 'args' in logEvent) {
					const args = logEvent.args as any;
					const playerAddress = args.sender.toLowerCase();
					const fleetId = args.fleetId.toString();

					const actionsTriggered: string[] = [];
					const fleetRevengesClaimed = this.state.fleetRevengesClaimed[fleetId];
					if (!fleetRevengesClaimed.previous && fleetRevengesClaimed.current) {
						actionsTriggered.push('1 Revenge Claimed');
					}
					if (actionsTriggered.length > 0) {
						return this.testAndFulfillQuest(playerAddress, actionsTriggered);
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
