import OpenAI from "openai";

// Initialize OpenAI client with your API key from env var
const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY not set. OpenAI enrichment will be disabled.");
}

/**
 * Enriches a React or Vue component source string with 2 Playwright assertion lines
 * by sending a prompt to the OpenAI o4-mini-high model.
 *
 * @param componentSrc - The source code of the component to analyze
 * @returns An array of `await` assertion lines for Playwright tests
 */
export async function enrichAssertionsOpenAI(componentSrc: string): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  const prompt = `Here is a React/Vue component.\n` +
      `Return 2 Playwright assertion lines that would verify it works.\n` +
      `Only code, no prose:\n\n${componentSrc}`;

  // Send the chat completion request
  const response = await client.chat.completions.create({
    model: "o4-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120
  });

  // Extract the generated text
  const raw = response.choices?.[0]?.message?.content ?? "";

  // Split into lines and return only those starting with "await"
  return raw
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.startsWith("await"));
}
