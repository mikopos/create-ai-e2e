// types/openai.d.ts
declare module "openai" {
  interface Choice {
    message: { role: string; content: string };
  }
  export interface ChatCompletion {
    choices: Choice[];
  }
  export interface ChatCompletionRequest {
    model: string;
    messages: { role: string; content: string }[];
    max_tokens?: number;
  }
  export class OpenAI {
    constructor(opts: { apiKey: string });
    chat: {
      completions: {
        create(req: ChatCompletionRequest): Promise<ChatCompletion>;
      };
    };
  }
  export default OpenAI;
}
