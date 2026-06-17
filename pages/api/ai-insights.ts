import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import type { AIInsightSummary, ErrorResponse } from '../../types';

type AIInsightResponse = { insight: string; model: string };

// Which Claude model to use. Configurable via env so it can be tuned for
// cost vs. quality without code changes. Defaults to a balanced, cost-efficient model.
// Cheapest: claude-haiku-4-5 | Balanced: claude-sonnet-4-6 | Most capable: claude-opus-4-8
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a warm, practical productivity coach. You are given a JSON summary of one person's Todoist activity (completed tasks, active tasks, projects, completion rates, productivity patterns, and goals).

Write a short, personalized analysis of how they are doing, then give concrete, actionable advice.

Guidelines:
- Be encouraging and human, but honest. Reference their actual numbers, project names, and patterns from the data — do not be generic.
- Structure your response in Markdown with these sections:
  1. "## How you're doing" — a 2-4 sentence overview.
  2. "## What's working" — 1-3 bullet points.
  3. "## Where to focus next" — 3-5 specific, actionable recommendations as bullet points. Tie each one to something concrete in their data (a neglected task, a busy project, their best time of day, a goal, etc.).
- Keep the whole response concise — aim for under 300 words.
- If the data is sparse (very few completed tasks), say so gently and give starter advice instead of over-interpreting.
- In tasksByPriority, p1 is the highest priority and p4 is the lowest.
- Write in the same language as the majority of the user's task titles (e.g. if their tasks are written in Indonesian, respond in Indonesian; if in English, respond in English). If unclear, use English.
- Respond ONLY with the coaching analysis itself. Do not include any preamble, sign-off, exploratory reasoning, or meta-commentary about your process.`;

function buildUserPrompt(summary: AIInsightSummary): string {
  return `Here is the person's Todoist productivity summary as JSON. Analyze it and write the coaching response following your instructions.

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\``;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIInsightResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      details: 'Only POST requests are supported',
    });
  }

  // Require an authenticated Todoist session, consistent with the other API routes.
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'You must be signed in to use the AI coach.',
    });
  }

  // Friendly message when the AI hasn't been configured yet.
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'AI not configured',
      details:
        'ANTHROPIC_API_KEY is not set on the server. Add it to your environment (.env.local) to enable AI insights.',
    });
  }

  const summary = (req.body as { summary?: unknown })?.summary;
  if (
    !summary ||
    typeof summary !== 'object' ||
    typeof (summary as AIInsightSummary).totalCompletedTasks !== 'number'
  ) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'A productivity "summary" object is required in the request body.',
    });
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(summary as AIInsightSummary) }],
    });

    const insight = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!insight) {
      return res.status(502).json({
        error: 'Empty AI response',
        details: 'The AI returned no text. Please try again.',
      });
    }

    return res.status(200).json({ insight, model: MODEL });
  } catch (error) {
    console.error('Error in ai-insights API:', error);

    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(502).json({
        error: 'AI authentication failed',
        details: 'The ANTHROPIC_API_KEY was rejected. Please check that it is valid.',
      });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({
        error: 'AI rate limit reached',
        details: 'Too many requests to the AI service. Please wait a moment and try again.',
      });
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: 'AI service error', details: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
