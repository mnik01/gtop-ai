
import z from "zod";
import { Env } from "..";
import { SYSTEM_PROMPT_WITH_EXAMPLE, getUserPropmt } from "./prompts";
import { GroqStrategy, LLM } from "../utils/llm";
import { getHash } from "../utils/getHash";

export const matcherHandler = async (request: Request, env: Env): Promise<string> => {
	const body = await request.json();

	const { input_cv, input_job } = z.object({
		input_cv: z.string(),
		input_job: z.string(),
	}).parse(body);

	// Check cache
	const cacheKey = `${await getHash(input_cv)}-${await getHash(input_job)}`;
	const cached = await env.MATCHER_CACHE.get(cacheKey);

	if (cached) return cached;

	const llm = new LLM(new GroqStrategy({
		apiKey: env.GROQ_API_KEY,
		modelName: 'llama3-8b-8192',
	}));

	const response = await llm.message(SYSTEM_PROMPT_WITH_EXAMPLE, getUserPropmt(input_cv, input_job));
	console.log(response);

	const { percentage, description } = z.object({
		percentage: z.string().refine((val) => !isNaN(parseFloat(val)), {
				message: "Percentage must be a valid number",
		}),
		description: z.string().min(1),
	}).parse(JSON.parse(response));

	// Cache response
	await env.MATCHER_CACHE.put(cacheKey, JSON.stringify({
		description,
		percentage,
	}), { expirationTtl: 60 * 60 * 24 });

	return JSON.stringify({ description, percentage });
};
