import type {Env} from '../env.js';

interface RequestData {
	actions: string[];
	playerAddress: string;
}

interface ResponseData {
	success: boolean;
}

export async function fullfillQuest(env: Env, data: RequestData): Promise<ResponseData> {
	const url = env.GG_API_URL;
	const headers: HeadersInit = {
		secret: env.GG_SECRET,
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
