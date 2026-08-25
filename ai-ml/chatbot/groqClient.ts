import { GroqChatCompletionMessage, GroqChatCompletionResponse } from "./types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function callGroq(
  messages: GroqChatCompletionMessage[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as GroqChatCompletionResponse;
  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("Groq API returned an empty response");
  }

  return reply;
}