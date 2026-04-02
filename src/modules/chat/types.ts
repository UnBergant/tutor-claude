/** Chat message role */
export type ChatRole = "user" | "assistant";

/** Base fields shared by all chat messages */
interface ChatMessageBase {
  id: string;
  createdAt: Date;
}

/** Regular text message (user or assistant) */
export interface TextMessage extends ChatMessageBase {
  type: "text";
  role: ChatRole;
  content: string;
}

/** Flashcard quiz message from Celestia */
export interface FlashcardMessage extends ChatMessageBase {
  type: "flashcard";
  role: "assistant";
  wordId: string;
  /** Spanish word (correct answer user must type) */
  word: string;
  /** English translation shown to user */
  prompt: string;
  /** Optional context sentence */
  hint?: string;
  status: "pending" | "correct" | "incorrect";
  /** What the user typed */
  userAnswer?: string;
}

/** Quiz exercise type — only MC and gap_fill for inline chat quizzes */
export type QuizExerciseType = "multiple_choice" | "gap_fill";

/** Single question within a quiz carousel */
export interface QuizQuestion {
  quizType: QuizExerciseType;
  question: string;
  correctAnswer: string;
  /** MC options (only for multiple_choice) */
  options?: string[];
  /** Brief explanation shown after answering */
  explanation?: string;
  status: "pending" | "correct" | "incorrect";
  userAnswer?: string;
}

/** Inline quiz message — carousel of 1-5 questions */
export interface QuizMessage extends ChatMessageBase {
  type: "quiz";
  role: "assistant";
  questions: QuizQuestion[];
  /** Index of the currently displayed question */
  currentIndex: number;
}

/** Any chat message (ephemeral — lives only in Zustand store) */
export type ChatMessage = TextMessage | FlashcardMessage | QuizMessage;

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

/** Translation data for a single word */
export interface WordTranslation {
  word: string;
  translation: string;
  partOfSpeech: string;
  form?: string;
}

/** Result of translating all words in a message */
export interface MessageTranslation {
  words: WordTranslation[];
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
