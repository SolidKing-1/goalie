// lib/llm.ts
import OpenAI from "openai";
import { Goal, Subscription, GoalAlignmentResult } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyzes each subscription against user goals and returns
 * alignment scores + keep/cancel recommendations.
 */
export async function analyzeGoalAlignment(
  subscriptions: Subscription[],
  goals: Goal[]
): Promise<GoalAlignmentResult[]> {
  if (!goals.length || !subscriptions.length) return [];

  const prompt = `
You are a personal finance advisor helping a user align their subscriptions with their goals.

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
- Respond ONLY with the JSON array, no other text
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  try {
    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw);
    const results: GoalAlignmentResult[] = Array.isArray(parsed)
      ? parsed
      : parsed.results ?? [];

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
  } catch {
    return [];
  }
}
