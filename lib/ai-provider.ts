/**
 * Unified AI provider abstraction supporting OpenAI and Google Gemini
 * Automatically selects provider based on env vars
 */

import { Goal, Subscription, GoalAlignmentResult } from "@/types";

export type AIProvider = "openai" | "gemini";

export interface AIAnalysisResult {
  results: GoalAlignmentResult[];
  provider: AIProvider;
  tokensUsed?: number;
}

/**
 * Analyzes subscriptions against goals using the configured AI provider
 */
export async function analyzeWithAI(
  subscriptions: Subscription[],
  goals: Goal[],
): Promise<GoalAlignmentResult[]> {
  if (!goals.length || !subscriptions.length) return [];

  const provider = detectProvider();

  if (provider === "gemini") {
    return analyzeWithGemini(subscriptions, goals);
  } else {
    return analyzeWithOpenAI(subscriptions, goals);
  }
}

function detectProvider(): AIProvider {
  // Prefer Gemini if available (cheaper), fallback to OpenAI
  if (process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";

  // If neither, default to gemini and let it fail with clear error
  console.warn(
    "No AI provider configured. Set GOOGLE_API_KEY or OPENAI_API_KEY.",
  );
  return "gemini";
}

async function analyzeWithGemini(
  subscriptions: Subscription[],
  goals: Goal[],
): Promise<GoalAlignmentResult[]> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not set. Please configure Gemini API key.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = buildAnalysisPrompt(subscriptions, goals);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return parseAnalysisResponse(responseText, subscriptions, goals);
}

async function analyzeWithOpenAI(
  subscriptions: Subscription[],
  goals: Goal[],
): Promise<GoalAlignmentResult[]> {
  const { default: OpenAI } = await import("openai");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set. Please configure OpenAI API key.");
  }

  const openai = new OpenAI({ apiKey });
  const prompt = buildAnalysisPrompt(subscriptions, goals);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0].message.content ?? "{}";
  return parseAnalysisResponse(responseText, subscriptions, goals);
}

function buildAnalysisPrompt(
  subscriptions: Subscription[],
  goals: Goal[],
): string {
  return `You are a personal finance advisor helping a user align their subscriptions with their goals.

USER GOALS:
${goals.map((g) => `- [${g.id}] ${g.title} (${g.category}): ${g.description ?? "No description"}`).join("\n")}

USER SUBSCRIPTIONS:
${subscriptions.map((s) => `- [${s.id}] ${s.name} (${s.category}): $${s.cost}/${s.billingCycle}`).join("\n")}

For each subscription, respond with a JSON array. Each item must have:
{
  "subscriptionId": "<id>",
  "goalId": "<most relevant goal id or null>",
  "alignmentScore": <0-100>,
  "recommendation": "KEEP" | "REVIEW" | "CANCEL",
  "reasoning": "<1-2 sentence explanation>"
}

Rules:
- alignmentScore 70-100 = strong alignment → KEEP
- alignmentScore 30-69 = weak alignment → REVIEW  
- alignmentScore 0-29 = no alignment → CANCEL
- Be practical and specific
- Respond ONLY with the JSON array, no other text (or wrapped in { results: [...] })`;
}

function parseAnalysisResponse(
  responseText: string,
  subscriptions: Subscription[],
  goals: Goal[],
): GoalAlignmentResult[] {
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : error}`,
    );
  }

  const results: GoalAlignmentResult[] = Array.isArray(parsed)
    ? parsed
    : (parsed.results ?? []);

  // Enrich with subscription/goal names
  return results.map((r) => {
    const sub = subscriptions.find((s) => s.id === r.subscriptionId);
    const goal = goals.find((g) => g.id === r.goalId);
    return {
      ...r,
      subscriptionName: sub?.name ?? "Unknown",
      goalTitle: goal?.title,
    };
  });
}
