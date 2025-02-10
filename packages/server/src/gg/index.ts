import type {Env} from '../env.js';

interface RequestData {
	actions: string[];
	playerAddress: string;
}

interface ResponseData {
	status: 'success' | 'error'; // TODO error ?
}

export class GG {
	public cache: {[player: string]: {registered: boolean; lastCheck: number}} = {};

	constructor(
		public env: Env,
		public ggEndPoint: string,
	) {}

	async fullfillQuest(data: RequestData): Promise<ResponseData> {
		const url = `${this.ggEndPoint}/action-dispatcher/dispatch/public`;
		const headers: HeadersInit = {
			secret: this.env.GG_SECRET,
			'Content-Type': 'application/json',
		};

		const requestOptions: RequestInit = {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(data),
		};

		return fetch(url, requestOptions).then(async (response: Response) => {
			if (!response.ok) {
				throw new Error(
					`HTTP error! status: ${response.status}, ${response.statusText} : ${await response.text()}, ${JSON.stringify(data, null, 2)}`,
				);
			}
			return response.json();
		});
		// console.log(`fullfillQuest`, data);
		// return {status: 'success'};
	}

	async hasGGProfile(playerAddress: string): Promise<boolean> {
		const timestamp = Math.floor(Date.now() / 1000);

		const fromCache = this.cache[playerAddress];
		if (fromCache) {
			if (fromCache.registered) {
				return true;
			} else if (fromCache.lastCheck && timestamp < fromCache.lastCheck + 10 * 60) {
				return fromCache.registered;
			}
		}

		const url = `${this.ggEndPoint}/auth-v2/player/info/${playerAddress}`;
		const headers: HeadersInit = {
			secret: this.env.GG_SECRET,
			accept: 'application/json',
		};

		const requestOptions: RequestInit = {
			method: 'GET',
			headers: headers,
		};

		const result: {hasMinted: boolean} = await fetch(url, requestOptions).then(async (response: Response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}, ${response.statusText} : ${await response.text()}`);
			}
			return response.json();
		});

		this.cache[playerAddress] = {
			registered: result.hasMinted,
			lastCheck: timestamp,
		};

		return result.hasMinted;
	}
}
