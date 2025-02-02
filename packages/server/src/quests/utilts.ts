import {Abi} from 'ethereum-indexer';

export async function unlessActionAlreadyRecorded(
	storage: Storage,
	questGroupID: string,
	actionID: string,
	func: () => Promise<boolean>,
): Promise<void> {
	const isRecorded = await storage.isActionRecorded(questGroupID, actionID);
	if (!isRecorded) {
		const toRecord = await func();
		if (toRecord) {
			await storage.recordAction(questGroupID, actionID);
		}
	}
}

export function mergeABIs(abi1: Abi, abi2: Abi): Abi {
	const namesUsed: {[name: string]: boolean} = {};
	const newABI = [];
	for (const fragment of abi1) {
		namesUsed[(fragment as any).name] = true;
		newABI.push(fragment);
	}
	for (const fragment of abi2) {
		if (!namesUsed[(fragment as any).name]) {
			namesUsed[(fragment as any).name] = true;
			newABI.push(fragment);
		}
	}
	return newABI;
}
