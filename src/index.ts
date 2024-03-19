import OpenAI from "openai";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	OPENAI_API_KEY: string;
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
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
		try {
			const openai = new OpenAI({
				apiKey: env.OPENAI_API_KEY,
			});

			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: [
					{
						"role": "system",
						"content": "You are a helpful assistant that will take as an input the Job position description and worker's CV about his skills.\n\nYou need to respond with percentage of match. How much is CV matches the job desciption.\n\nPercentage can be from 0% to 100%\nWhere 0% means - CV is absolutely unrelated to Job\nAnd where 100% means - CV is absolutely matches the Job\n\nExmaple:\nInput CV\nRobert M. 26 age Male\nReact front-end web developer, 3 years of experience, Jira, React, Next, Javascript, Typescript\n\nInput Job \nSenior Project manager position at the Sapar LLC\nJira, Linear, team management, agile kanban 2+ years of experience\n\nOutput (your response): \nCV Matches Job — 18%\n\nDescription why:\n\n\n\nExmaple 2:\nInput CV\nRobert M. 26 age Male\nReact front-end web developer, 3 years of experience, Jira, React, Next, Javascript, Typescript\n\nInput Job \nSenior Front-end Developer position at the Sapar LLC\nreact, next, redux, typescript, tailwindcss, css ,js , html, OOP, kanban 2.5+ years of experience\n\nOutput: \nCV Matches Job — 95%\n\nDescription why:\n"
					},
					{
						"role": "user",
						"content": "{\n  \"input_cv\": \"Maxim N. Front-end developer 4 year of experience. react typescript, redux ,figma jira linear, kanban, agile\",\n  \"input_job\": \"Sapar Engineering Manager - Job Description\\nExperienced engineering manager with 6-10 years of experience\\n3-5 years of experience as a senior software engineer\\n3-5 years of experience as an engineering manager\\nHas led software development projects to successful completion\\nStrong hands-on experience with Scrum and can lead Agile ceremonies including daily scrum, sprint demos, sprint retrospectives, sprint planning, etc.\\nExperience managing software engineers providing daily guidance and oversight \\nStrong experience with the building and deployment of mobile applications\\nDemonstrable experience working with product managers and product owners \\nExcellent communication skills both written and verbal; strong English language skills\\nAble to produce and communicate development status to executive leadership and stakeholders\\nAble to participate in and lead meetings with executive leadership\\nExperience with production support and overseeing the successful resolution of production problems\\nStrong experience driving quality in the software development process\\n﻿\\nTechnical Skills\\niOS and Android application development\\nDatabase technologies\\nJira/Confluence\\nStrong understanding of SDLC phases\\nUnderstanding of monolithic and microservices architectures\",\n}"
					},
				],
				temperature: 1,
				max_tokens: 256,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
			});

			const msg = response?.choices.at(0)?.message?.content || 'No response';

			const percentageRegex = /(\d+|\d{2,3})%/;
			const match = msg.match(percentageRegex);
			const percentage = match ? match[0] : null;
			const desciption = msg.split('why:')[1];

			console.log(msg);

			if (msg && !percentage || !desciption) {
				throw new Error('Unable to parse response from OpenAI API');
			}

			return new Response(JSON.stringify({
				percentage,
				desciption,
			}), { status: 200, headers: { "Content-Type": "application/json" } });
		} catch (e) {
			// @ts-expect-error
			return new Response(JSON.stringify({ error: JSON.stringify(e?.message || e) }), { status: 500, headers: { "Content-Type": "application/json" } });
		}
	},
};
