import {Abi, LastSync} from 'ethereum-indexer';

export interface Storage {
	saveLastSync<ABI extends Abi>(id: string, lastSync: LastSync<ABI>): Promise<void>;
	loadLastSync<ABI extends Abi>(id: string): Promise<LastSync<ABI> | undefined>;

	recordAction(id: string): Promise<void>;
	isActionRecorded(id: string): Promise<boolean>;

	setup(): Promise<void>;
	reset(): Promise<void>;
}
