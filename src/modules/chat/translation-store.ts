import { create } from "zustand";
import type { WordTranslation } from "./types";

interface TranslationState {
  /** Translations keyed by messageId → normalizedWord → WordTranslation */
  cache: Record<string, Record<string, WordTranslation>>;
  /** Loading state keyed by messageId */
  loading: Record<string, boolean>;

  // Actions
  setTranslations: (messageId: string, words: WordTranslation[]) => void;
  setLoading: (messageId: string, isLoading: boolean) => void;
  getTranslation: (
    messageId: string,
    word: string,
  ) => WordTranslation | undefined;
  isLoading: (messageId: string) => boolean;
  reset: () => void;
}

const initialState = {
  cache: {} as Record<string, Record<string, WordTranslation>>,
  loading: {} as Record<string, boolean>,
};

function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  ...initialState,

  setTranslations: (messageId, words) => {
    const wordMap: Record<string, WordTranslation> = {};
    for (const w of words) {
      wordMap[normalizeWord(w.word)] = w;
    }
    set({ cache: { ...get().cache, [messageId]: wordMap } });
  },

  setLoading: (messageId, isLoading) => {
    set({ loading: { ...get().loading, [messageId]: isLoading } });
  },

  getTranslation: (messageId, word) => {
    return get().cache[messageId]?.[normalizeWord(word)];
  },

  isLoading: (messageId) => {
    return get().loading[messageId] ?? false;
  },

  reset: () => set(initialState),
}));
