import { matcherHandler } from "./matcher";
import { modifierHandler } from "./modifier";

const HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Max-Age": "86400",
}

export interface Env {
	OPENAI_API_KEY: string;
	MATCHER_CACHE: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: HEADERS });
		}

		try {
			if (request.url.endsWith("/matcher")) {
				return new Response(await matcherHandler(request, env), { status: 200, headers: HEADERS });
			} else if (request.url.endsWith("/modifier")) {
				return new Response(await modifierHandler(request, env), { status: 200, headers: HEADERS });
			}

			throw new Error(`unknown route ${request.url}`);
		} catch (e) {
			// @ts-expect-error
			console.error(JSON.stringify({ error: `top level error: ${JSON.stringify(e?.message || e)}` }), { status: 500, headers: HEADERS });
			// @ts-expect-error
			return new Response(JSON.stringify({ error: JSON.stringify(e?.message || e) }), { status: 500, headers: HEADERS });
		}
	},
};
