"use server";

import { generateStructured } from "@/shared/lib/ai/client";
import { auth } from "@/shared/lib/auth";
import { saveChatExtractionData } from "./chat-helper";
import type { ChatExtractionResult, ChatMessage } from "./types";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    vocabulary: {
      type: "array",
      description:
        "New Spanish words the student used or learned during the conversation",
      items: {
        type: "object",
        properties: {
          word: { type: "string", description: "Spanish word or phrase" },
          translation: { type: "string", description: "English translation" },
          context: {
            type: "string",
            description: "Example sentence from the conversation",
          },
        },
        required: ["word", "translation", "context"],
      },
    },
    interests: {
      type: "array",
      description:
        "Topics the student showed interest in during the conversation",
      items: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Topic name (e.g., 'travel', 'cooking', 'sports')",
          },
          confidence: {
            type: "integer",
            description:
              "How confident are you this is a genuine interest (integer 0-100)",
          },
        },
        required: ["topic", "confidence"],
      },
    },
    mistakes: {
      type: "array",
      description: "Grammar or vocabulary mistakes the student made",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["GRAMMAR", "VOCABULARY", "WORD_ORDER"],
            description: "Type of mistake",
          },
          pattern: {
            type: "string",
            description:
              "Brief description of the mistake pattern (e.g., 'ser/estar confusion', 'subjunctive after cuando')",
          },
        },
        required: ["category", "pattern"],
      },
    },
  },
  required: ["vocabulary", "interests", "mistakes"],
};

/**
 * Extract structured learning data from a completed chat session.
 *
 * Uses Haiku (via "evaluation" endpoint) to analyze the conversation
 * and extract vocabulary, interests, and mistakes.
 */
export async function extractChatData(
  messages: Pick<ChatMessage, "role" | "content">[],
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  const userId = session.user.id;

  // Skip extraction for very short conversations
  if (messages.length < 4) {
    return { success: true };
  }

  try {
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "Student" : "Celestia"}: ${m.content}`)
      .join("\n\n");

    const { data } = await generateStructured<ChatExtractionResult>({
      endpoint: "evaluation",
      system:
        "You are analyzing a Spanish conversation between a student and their tutor Celestia. Extract useful learning data from the conversation.",
      userMessage: `Analyze this conversation and extract:\n1. New vocabulary the student encountered or used\n2. Topics the student seems interested in\n3. Mistakes the student made in Spanish\n\nConversation:\n${conversationText}`,
      toolName: "extract_chat_data",
      toolDescription:
        "Extract vocabulary, interests, and mistakes from a chat conversation",
      schema: EXTRACTION_SCHEMA,
      userId,
    });

    await saveChatExtractionData(userId, data);

    return { success: true };
  } catch (error) {
    console.error("[extractChatData] Failed:", error);
    return { success: false };
  }
}
