# Phase 4: Chat with Celestia

## Goal
Free chat + situation mode + error correction.

## Steps

1. **Chat UI** — Zustand store, SSE streaming via Route Handler, error highlighting, mobile-friendly
2. **Situation Mode** — scenario selection (restaurant, interview, introduction), target vocabulary
3. **Chat Route Handler** — Claude API streaming, Celestia persona, real-time corrections
4. **Conversation Data Strategy** — extract interests + mistakes via Server Action after each conversation, don't store full message history. Store extracted data as structured records:
   - `UserInterest { topic, confidence: 0-100, source: 'chat'|'exercise', lastMentioned, mentionCount }`
   - `MistakeEntry { category: 'grammar'|'vocabulary'|'word_order', pattern, count, lastOccurred, relatedTopicId }`
   - Chat messages: keep only last N messages as context window for current session, discard on session end

## Verification
- Chat works with streaming on mobile and desktop
- Errors highlighted inline
- Situation mode launches with scenario context
- Chat data influences program
- Token usage tracked per chat session
