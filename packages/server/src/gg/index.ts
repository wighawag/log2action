import type {Env} from '../env.js';

interface RequestData {
	actions: string[];
	playerAddress: string;
}

interface ResponseData {
	status: 'success' | 'error'; // TODO error ?
}

export class GG {
	constructor(public env: Env) {}

	async fullfillQuest(data: RequestData): Promise<ResponseData> {
		const url = `${this.env.GG_API_URL}/action-dispatcher/dispatch/public`;
		const headers: HeadersInit = {
			secret: this.env.GG_SECRET,
			'Content-Type': 'application/json',
		};

		const requestOptions: RequestInit = {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(data),
		};

		return fetch(url, requestOptions).then((response: Response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		});
	}

	async hasGGProfile(playerAddress: string): Promise<boolean> {
		const url = `${this.env.GG_API_URL}/auth-v2/player/info/${playerAddress}`;
		const headers: HeadersInit = {
			secret: this.env.GG_SECRET,
			accept: 'application/json',
		};

		const requestOptions: RequestInit = {
			method: 'GET',
			headers: headers,
		};

		const result: {hasMinted: boolean} = await fetch(url, requestOptions).then((response: Response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		});

		return result.hasMinted;
	}
}
