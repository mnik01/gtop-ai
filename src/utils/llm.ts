import Groq from 'groq-sdk';
import OpenAI from "openai";

export interface ClientOptions {
  apiKey: string;
	modelName: string;
}

type MessageResponse = string;

interface MessageGenerationStrategy {
  message(system: string, prompt: string): Promise<MessageResponse>;
}

export class ChatGPTStrategy implements MessageGenerationStrategy {
  private apiKey: string;
  private modelName: string;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.modelName = options.modelName;
  }

  async message(system: string, prompt: string): Promise<MessageResponse> {
		const openai = new OpenAI({
			apiKey: this.apiKey,
		});

		const response = await openai.chat.completions.create({
			model: this.modelName,
			messages: [
				{
					"role": "system",
					"content": system,
				},
				{
					"role": "user",
					"content": prompt,
				},
			],
			temperature: 0.25,
			max_tokens: 256,
			top_p: 1,
			frequency_penalty: 0.15,
			presence_penalty: 0,
		});
		const msg = response?.choices.at(0)?.message?.content || 'No response';
		return msg;
  }
}

export class GroqStrategy implements MessageGenerationStrategy {
  private apiKey: string;
  private modelName: string;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.modelName = options.modelName;
  }

  async message(system: string, prompt: string): Promise<MessageResponse> {
		const groq = new Groq({
			apiKey: this.apiKey,
		});

		const chatCompletion = await groq.chat.completions.create({
			"messages": [
				{
					role: "system",
					content: system,
				},
				{
					role: "user",
					content: prompt
				}
			],
			model: this.modelName,
			temperature: 0.25,
			max_tokens: 512,
			top_p: 1,
			stream: false,
			response_format: {
				type: "json_object"
			},
			stop: null
		});

		return chatCompletion?.choices?.at(0)?.message?.content || 'No response';
  }
}

export class LLM {
  private strategy: MessageGenerationStrategy;

  constructor(strategy: MessageGenerationStrategy) {
    this.strategy = strategy;
  }

  async message(system: string, prompt: string): Promise<MessageResponse> {
    return this.strategy.message(system, prompt);
  }
}
