# Phase 7: AI Improvements

> Post-launch AI enhancements. Each task is independent — no strict ordering within the phase.

## Goal
Elevate Celestia's AI capabilities beyond basic exercise generation and chat. Focus on personalization, memory, and adaptive learning.

## Tasks

### 7-1. Long-term User Memory with RAG
**Status:** Backlog
**Jira:** KAN-43

**Problem:** Celestia starts every chat session from zero — no knowledge of the user's name, interests, previous conversations, or learning patterns.

**Goal:** Build a persistent memory system using RAG (Retrieval-Augmented Generation) so Celestia can:
- Remember user facts (name, age, interests, goals, preferences)
- Store summaries of previous conversations
- Retrieve relevant context at the start of each new chat
- Build a growing understanding of the student over time

**Research areas:**
- Memory architectures: ChatGPT memory, Mem0, LangChain memory modules
- Vector databases: pgvector (Neon-native), Pinecone, Weaviate, Chroma
- Extraction strategies: per-session fact extraction, rolling summaries, entity extraction
- Retrieval patterns: semantic search, recency weighting, importance scoring
- Privacy: user-visible memory, deletion, export

**Technical approach (TBD after research):**
- Extend existing post-chat extraction pipeline (`extractChatData`)
- Store memories as embeddings in vector DB
- Before each chat: retrieve top-K relevant memories → inject into system prompt
- Periodic memory consolidation (merge/summarize old memories)

**Acceptance criteria:**
- Celestia remembers user's name and key facts across sessions
- Previous conversation topics are recalled when relevant
- User can view and delete stored memories
- Architecture documented with rationale for chosen approach

## Verification
- Each task has its own acceptance criteria
- AI improvements tested via manual conversation testing + automated checks where applicable
