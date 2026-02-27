import Anthropic from "@anthropic-ai/sdk";
import { checkAiLimit, getAiSettings, recordAiUsage } from "./rate-limiter";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ maxRetries: 5 });
  }
  return client;
}

interface GenerateStructuredOptions<_T = unknown> {
  /** AI settings endpoint name (e.g., "assessment") — used for model selection and rate limiting */
  endpoint: string;
  /** System prompt */
  system: string;
  /** User message */
  userMessage: string;
  /** Tool name for structured output */
  toolName: string;
  /** Tool description */
  toolDescription: string;
  /** JSON schema for the expected output (as Anthropic input_schema) */
  schema: Record<string, unknown>;
  /** User ID for rate limiting and usage tracking */
  userId: string;
  /** Optional model override (otherwise uses endpoint default) */
  model?: string;
  /** Max tokens for the response */
  maxTokens?: number;
}

/**
 * Generate structured output from Claude using tool_use.
 *
 * This is the standard pattern for getting typed JSON from Claude:
 * define a "tool" with the desired JSON schema, force the model to
 * call it, and parse the tool_use block as the result.
 */
export async function generateStructured<T>(
  options: GenerateStructuredOptions<T>,
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  const settings = await getAiSettings(options.endpoint);
  const model = options.model ?? settings.model;

  // Check rate limits before making the AI call
  const limitCheck = await checkAiLimit(options.userId);
  if (!limitCheck.allowed) {
    throw new Error("AI usage limit exceeded. Please try again later.");
  }

  const response = await getClient().messages.create({
    model,
    max_tokens: options.maxTokens ?? 1024,
    system: options.system,
    messages: [{ role: "user", content: options.userMessage }],
    tools: [
      {
        name: options.toolName,
        description: options.toolDescription,
        input_schema: options.schema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: options.toolName },
  });

  // Extract the tool_use block
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No tool_use block in Claude response");
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Record usage
  await recordAiUsage(options.userId, {
    model,
    tokensInput: inputTokens,
    tokensOutput: outputTokens,
    endpoint: options.endpoint,
  });

  return {
    data: toolUse.input as T,
    inputTokens,
    outputTokens,
  };
}
