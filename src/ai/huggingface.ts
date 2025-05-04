import axios from "axios";

// Your Hugging Face API token (get one free at https://huggingface.co/settings/tokens)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
// The model to use; default to Llama-2-7b-chat-hf on the free inference tier
const HF_MODEL = process.env.HF_MODEL ?? "google/flan-t5-small";
// Inference endpoint for text-generation pipeline
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

if (!HF_API_KEY) {
  console.warn(
      "⚠️ HUGGINGFACE_API_KEY not set. Hugging Face enrichment will be disabled."
  );
}

/**
 * Enriches a React or Vue component source string with 2 Playwright assertion lines
 * by calling the Hugging Face text-generation inference API.
 *
 * @param componentSrc - The source code of the component to analyze
 * @returns An array of `await`-prefixed assertion lines
 */
export async function enrichAssertionsHuggingFace(
    componentSrc: string
): Promise<string[]> {
  if (!HF_API_KEY) {
    return [];
  }

  const prompt =
      `Here is a React/Vue component.\n` +
      `Return 2 Playwright assertion lines that would verify it works.\n` +
      `Only code, no prose:\n\n${componentSrc}`;

  try {
    const response = await axios.post(
        HF_API_URL,
        {
          inputs: prompt,
          parameters: { max_new_tokens: 120 }
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
    );

    // The HF text-generation pipeline returns an array of { generated_text }
    const generated = (response.data as Array<any>)[0]?.generated_text ?? "";

    // Extract only lines starting with 'await'
    return generated
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("await"));
  } catch (err) {
    console.warn(
        `⚠️ Hugging Face enrichment failed (model=${HF_MODEL}):`,
        err
    );
    return [];
  }
}
