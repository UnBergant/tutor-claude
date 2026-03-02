/** Chat message role */
export type ChatRole = "user" | "assistant";

/** A single chat message (ephemeral — lives only in Zustand store) */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

/** A predefined conversation scenario */
export interface Situation {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Additional system prompt context for this scenario */
  systemPromptAddition: string;
  /** Celestia's opening message when the scenario starts */
  starterMessage: string;
  /** Target vocabulary to practice (optional, for extraction hints) */
  targetVocabulary: string[];
  /** Minimum CEFR level for this scenario */
  minLevel: string;
}

/** Request body for POST /api/chat */
export interface ChatRequestBody {
  messages: { role: ChatRole; content: string }[];
  situationId: string | null;
}

/** Extracted data from a completed chat session */
export interface ChatExtractionResult {
  vocabulary: {
    word: string;
    translation: string;
    context: string;
  }[];
  interests: {
    topic: string;
    confidence: number;
  }[];
  mistakes: {
    category: "GRAMMAR" | "VOCABULARY" | "WORD_ORDER";
    pattern: string;
  }[];
}
