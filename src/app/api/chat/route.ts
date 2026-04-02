import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { NextResponse } from "next/server";
import type { ChatRequestBody } from "@/modules/chat/types";
import { getClient } from "@/shared/lib/ai/client";
import { buildChatSystemPrompt } from "@/shared/lib/ai/prompts/chat";
import {
  checkAiLimit,
  getAiSettings,
  recordAiUsage,
} from "@/shared/lib/ai/rate-limiter";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

const GENERATE_QUIZ_TOOL: Tool = {
  name: "generate_quiz",
  description:
    "Generate a set of 3 inline quiz exercises for the student (carousel)",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        description:
          "Array of 3 quiz questions. Mix types (MC + gap_fill) for variety.",
        items: {
          type: "object",
          properties: {
            quiz_type: {
              type: "string",
              enum: ["multiple_choice", "gap_fill"],
              description: "Type of quiz",
            },
            question: {
              type: "string",
              description: "The question or sentence with ___ for gap",
            },
            correct_answer: {
              type: "string",
              description: "The correct answer",
            },
            options: {
              type: "array",
              items: { type: "string" },
              description: "MC options (4 items, required for multiple_choice)",
            },
            explanation: {
              type: "string",
              description: "Brief explanation shown after answering",
            },
          },
          required: ["quiz_type", "question", "correct_answer", "explanation"],
        },
        minItems: 3,
        maxItems: 3,
      },
    },
    required: ["questions"],
  },
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit check
  const limitCheck = await checkAiLimit(userId);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "rate_limit",
        message: "Usage limit reached. Please try again later.",
      },
      { status: 429 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { messages, situationId } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages are required" },
      { status: 400 },
    );
  }

  // Input validation: cap message count and length, enforce valid roles
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Too many messages" }, { status: 400 });
  }

  const validRoles = new Set(["user", "assistant"]);
  for (const m of messages) {
    if (!validRoles.has(m.role)) {
      return NextResponse.json(
        { error: "Invalid message role" },
        { status: 400 },
      );
    }
    if (
      typeof m.content !== "string" ||
      m.content.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
  }

  // Read level from DB — never trust client-provided level
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { currentLevel: true },
  });
  const level = VALID_LEVELS.has(profile?.currentLevel ?? "")
    ? (profile?.currentLevel as string)
    : "A1";

  // Build situation-specific prompt addition if needed
  let situationPrompt: string | undefined;
  if (situationId) {
    // Dynamic import to avoid bundling situations data in the route
    const { SITUATIONS } = await import("@/modules/chat/situations");
    const situation = SITUATIONS.find((s) => s.id === situationId);
    if (situation) {
      situationPrompt = situation.systemPromptAddition;
    }
  }

  const settings = await getAiSettings("chat");
  const model = settings.model;

  const systemPrompt = buildChatSystemPrompt({ level, situationPrompt });

  const stream = getClient().messages.stream({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [GENERATE_QUIZ_TOOL],
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  // Fire-and-forget usage recording after stream completes
  stream
    .finalMessage()
    .then((msg) =>
      recordAiUsage(userId, {
        model,
        tokensInput: msg.usage.input_tokens,
        tokensOutput: msg.usage.output_tokens,
        endpoint: "chat",
      }),
    )
    .catch((err) => console.error("[chat/route] Usage recording failed:", err));

  return new Response(stream.toReadableStream(), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
