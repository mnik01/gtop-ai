import OpenAI from "openai";
import { SYSTEM_PROMPT, getUserPropmt } from "./prompts";
import z from "zod";
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

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
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: HEADERS });
		}

		try {
			const body = await request.json();
			const { input_cv, input_job } = z.object({
				input_cv: z.string(),
				input_job: z.string(),
			}).parse(body);

			// Check cache
			const input_cv_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input_cv)).then(hashBuffer => {
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
			}
			);
			const input_job_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input_job)).then(hashBuffer => {
				const hashArray = Array.from(new Uint8Array(hashBuffer));
				return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
			}
			);
			const cacheKey = `${input_cv_hash}-${input_job_hash}`;
			const cached = await env.MATCHER_CACHE.get(cacheKey);

			if (cached) {
				return new Response(cached, { status: 200, headers: HEADERS });
			}

			const openai = new OpenAI({
				apiKey: env.OPENAI_API_KEY,
			});

			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						"role": "system",
						"content": SYSTEM_PROMPT,
					},
					{
						"role": "user",
						"content": getUserPropmt(input_cv, input_job),
					},
				],
				temperature: 0,
				max_tokens: 256,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
			});

			const msg = response?.choices.at(0)?.message?.content || 'No response';
			console.log(msg)

			try {
				const { percentage, description } = z.object({
					percentage: z.string(),
					description: z.string(),
				}).parse(JSON.parse(msg));

				if (msg && !percentage || !description) {
					throw new Error('Unable to parse response from OpenAI API: ' + msg);
				}

				// Cache response
				await env.MATCHER_CACHE.put(cacheKey, JSON.stringify({
					description,
					percentage,
				}), { expirationTtl: 60 * 60 * 24 });

				return new Response(JSON.stringify({
					description,
					percentage,
				}), { status: 200, headers: HEADERS });
			} catch (error) {
				console.error(error);
				return new Response(JSON.stringify({ error: JSON.stringify(error), msg }), { status: 500, headers: HEADERS });
			}
		} catch (e) {
			console.error(e);
			// @ts-expect-error
			return new Response(JSON.stringify({ error: JSON.stringify(e?.message || e) }), { status: 500, headers: HEADERS });
		}
	},
};
