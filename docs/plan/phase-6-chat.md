# Phase 6: Chat with Celestia

## Goal
Free chat + situation mode + error correction.

## Steps

1. **Chat UI** — Zustand store, SSE streaming via Route Handler, error highlighting, mobile-friendly
2. **Situation Mode** — scenario selection (restaurant, interview, introduction), target vocabulary
3. **Chat Route Handler** — Claude API streaming, Celestia persona, real-time corrections
4. **Conversation Data Strategy** — extract interests + mistakes via Server Action, don't store full history

## Verification
- Chat works with streaming on mobile and desktop
- Errors highlighted inline
- Situation mode launches with scenario context
- Chat data influences program
- Token usage tracked per chat session
