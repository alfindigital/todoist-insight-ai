import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import type { AIInsightSummary, ErrorResponse } from '../../types';

type Provider = 'gemini' | 'anthropic';
type AIInsightResponse = { insight: string; model: string; provider: Provider };

// Default model per provider, both overridable via env so they can be tuned for
// cost/quality without code changes.
// Gemini free tier (Google AI Studio): 2.5 Flash / Flash-Lite, 3 Flash, etc.
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
// Claude: cheapest claude-haiku-4-5 | balanced claude-sonnet-4-6 | most capable claude-opus-4-8
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

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

type ResolvedProvider = { provider: Provider; model: string };

// Decide which AI backend to use. Prefer the free provider (Gemini) when its key is
// present so the coach works at no cost; fall back to Anthropic. An explicit
// AI_PROVIDER env ("gemini" | "anthropic") can force a specific choice.
function resolveProvider(): ResolvedProvider | null {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  const gemini: ResolvedProvider = {
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  };
  const anthropic: ResolvedProvider = {
    provider: 'anthropic',
    model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
  };

  if (explicit === 'gemini' && hasGemini) return gemini;
  if (explicit === 'anthropic' && hasAnthropic) return anthropic;
  if (hasGemini) return gemini;
  if (hasAnthropic) return anthropic;
  return null;
}

async function generateWithGemini(model: string, summary: AIInsightSummary): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const response = await ai.models.generateContent({
    model,
    contents: buildUserPrompt(summary),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // Generous cap: short answer + any model "thinking" tokens, without truncating.
      maxOutputTokens: 8192,
    },
  });
  return (response.text ?? '').trim();
}

async function generateWithAnthropic(model: string, summary: AIInsightSummary): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(summary) }],
  });
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

// Pull an HTTP status code off an unknown error, if present (Gemini/generic errors).
function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function mapErrorToResponse(
  error: unknown,
  provider: Provider
): { status: number; body: ErrorResponse } {
  // Anthropic's typed errors.
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: 502,
      body: {
        error: 'AI authentication failed',
        details: 'The ANTHROPIC_API_KEY was rejected. Please check that it is valid.',
      },
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      body: {
        error: 'AI rate limit reached',
        details: 'Too many requests to the AI service. Please wait a moment and try again.',
      },
    };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: 502, body: { error: 'AI service error', details: error.message } };
  }

  // Gemini / generic errors expose an HTTP status code.
  const status = getErrorStatus(error);
  if (status === 429) {
    return {
      status: 429,
      body: {
        error: 'AI rate limit reached',
        details:
          provider === 'gemini'
            ? 'Gemini free-tier limit reached. Please wait a bit and try again.'
            : 'Too many requests to the AI service. Please wait a moment and try again.',
      },
    };
  }
  if (status === 400 || status === 401 || status === 403) {
    return {
      status: 502,
      body: {
        error: 'AI authentication failed',
        details:
          provider === 'gemini'
            ? 'The GEMINI_API_KEY was rejected or invalid. Get a free key at https://aistudio.google.com/apikey and check it.'
            : 'The AI key was rejected. Please check that it is valid.',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    },
  };
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

  // Friendly message when no AI provider has been configured yet.
  const selected = resolveProvider();
  if (!selected) {
    return res.status(503).json({
      error: 'AI not configured',
      details:
        'No AI key is set on the server. Add GEMINI_API_KEY (free — get one at https://aistudio.google.com/apikey) or ANTHROPIC_API_KEY to enable AI insights.',
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
    const insight =
      selected.provider === 'gemini'
        ? await generateWithGemini(selected.model, summary as AIInsightSummary)
        : await generateWithAnthropic(selected.model, summary as AIInsightSummary);

    if (!insight) {
      return res.status(502).json({
        error: 'Empty AI response',
        details: 'The AI returned no text. Please try again.',
      });
    }

    return res.status(200).json({ insight, model: selected.model, provider: selected.provider });
  } catch (error) {
    console.error('Error in ai-insights API:', error);
    const mapped = mapErrorToResponse(error, selected.provider);
    return res.status(mapped.status).json(mapped.body);
  }
}
