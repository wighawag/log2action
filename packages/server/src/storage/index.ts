import {Abi, LastSync} from 'ethereum-indexer';

export interface Storage {
	saveLastSync<ABI extends Abi>(questGroupID: string, lastSync: LastSync<ABI>): Promise<void>;
	loadLastSync<ABI extends Abi>(questGroupID: string): Promise<LastSync<ABI> | undefined>;

	recordAction(questGroupID: string, actionID: string): Promise<void>;
	isActionRecorded(questGroupID: string, actionID: string): Promise<boolean>;

	setup(): Promise<void>;
	reset(): Promise<void>;
}
