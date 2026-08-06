/** Central OpenAI model config for Eduprompt. */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.6-terra';

/**
 * Completion ceilings (not a cost target).
 * With GPT-5.x, reasoning tokens count against max_completion_tokens,
 * so ceilings must leave ample headroom beyond visible output.
 * Raising the ceiling does not increase cost — only used tokens are billed.
 */
export const TOKEN_BUDGET = {
  /** Short JSON dialogue turns (Input-KI). */
  inputKi: 8_000,
  /** Final V1 instruction text. */
  generateInstructions: 8_000,
  /** 2–3 structured proposals. */
  proposals: 16_000,
  /** Full sketch + long AI prompts (150–400 words each). */
  elaborate: 48_000,
} as const;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  maxCompletionTokens: number;
  json?: boolean;
};

/**
 * Call OpenAI Chat Completions with GPT-5.x-compatible params.
 * - max_completion_tokens (not legacy max_tokens)
 * - no custom temperature (Terra only allows default 1)
 */
export async function createChatCompletion({
  messages,
  maxCompletionTokens,
  json = false,
}: ChatCompletionOptions): Promise<{
  ok: boolean;
  status: number;
  content: string | null;
  errorText?: string;
  finishReason?: string | null;
  usage?: unknown;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, content: null, errorText: 'OpenAI API key not set.' };
  }

  const body: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages,
    max_completion_tokens: maxCompletionTokens,
  };

  if (json) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, content: null, errorText };
  }

  const data = await response.json();
  const finishReason = data.choices?.[0]?.finish_reason ?? null;
  if (finishReason === 'length') {
    console.warn(
      `[openai] Output truncated (finish_reason=length). model=${OPENAI_MODEL} budget=${maxCompletionTokens}`,
      data.usage
    );
  }

  return {
    ok: true,
    status: response.status,
    content: data.choices?.[0]?.message?.content ?? null,
    finishReason,
    usage: data.usage,
  };
}
