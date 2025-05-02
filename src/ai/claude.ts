import { Anthropic } from "@anthropic-ai/sdk";

// Initialize Anthropic client with your API key
const client = new Anthropic({ apiKey: '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'});

/**
 * Enriches a React or Vue component source string with 2 Playwright assertion lines
 * by sending a prompt to Claude 3.7 via the @anthropic-ai/sdk.
 *
 * @param componentSrc - The source code of the component to analyze
 * @returns An array of `await` assertion lines for Playwright tests
 */
export async function enrichAssertions(componentSrc: string): Promise<string[]> {
  // Build the prompt for Claude
  const prompt = `Here is a React/Vue component.\n` +
      `Return 2 Playwright assertion lines that would verify it works.\n` +
      `Only code, no prose:\n\n${componentSrc}`;

  // Send the completion request
  const response = await client.completions.create({
    model: "claude-3.7",
    prompt,
    max_tokens_to_sample: 120,
  });

  // Extract the generated content from the response
  // Depending on SDK version, content may be under .completion or .choices[0].message.content
  const raw = response.completion;

  // Split into lines and return only those starting with "await"
  return raw
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("await"));
}