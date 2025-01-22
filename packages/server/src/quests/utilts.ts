export async function unlessActionAlreadyRecorded(
	storage: Storage,
	id: string,
	func: () => Promise<boolean>,
): Promise<void> {
	const isRecorded = await storage.isActionRecorded(id);
	if (!isRecorded) {
		const toRecord = await func();
		if (toRecord) {
			await storage.recordAction(id);
		}
	}
}
