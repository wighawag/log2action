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
