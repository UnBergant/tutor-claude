# PRODUCT.md — Celestia: AI Spanish Tutor

## Vision

A personalized AI language tutor that combines the best of both worlds: the adaptability and personal approach of a real tutor with the interactive, gamified experience of platforms like Duolingo and Skyeng.

## Problem

1. **Scattered knowledge** — learners who study through mixed methods (conversations, courses, ChatGPT, personal tutors, group lessons) develop unstructured knowledge. They speak freely but have grammar gaps, know some tenses but not others, and feel bored at courses because the program doesn't match their actual level.

2. **Tutors lack interactive platforms** — personal tutors provide great personalization and feedback, but they usually don't have an interactive online platform with engaging exercises behind them.

3. **Platforms lack personalization** — apps like Duolingo and Skyeng have excellent interactive interfaces, but offer rigid programs. They don't adapt to what you already know, and they don't feel like a real tutor who understands your specific gaps.

**Celestia bridges this gap** — a real AI tutor with a personal approach, backed by an interactive exercise platform that adapts entirely to you.

## Core Concept

- AI-powered level assessment that maps specific knowledge gaps (e.g., "knows Present Indicative, weak on Subjunctive")
- Grammar curriculum skeleton based on Instituto Cervantes Plan Curricular (see `docs/grammar/`)
- Dynamic lesson generation based on assessment results, progress, and user interests
- Personal curriculum that adapts after every session — mistakes shape future lessons
- Interactive exercises (Duolingo/Skyeng style) generated around topics the user cares about
- Free conversation about anything — culture, travel, flirting, daily life — to practice naturally
- **Spanish from Spain (Castellano)**, not Latin American Spanish

## Celestia (AI Tutor Persona)

- Name: **Celestia**
- Role: personal Spanish tutor
- Personality: friendly, encouraging, uses popular Spanish phrases and expressions to teach the user to sound more native
- Language style: teaches Castellano (Spain Spanish) — vosotros, pronunciation, vocabulary, and cultural context from Spain
- Interface language: English (MVP), Russian (post-MVP)
- Target language: Spanish (MVP)

## MVP Features

### 1. Onboarding & Assessment
- Social login (Google)
- Quick pre-assessment: "Have you studied Spanish before?", approximate level selection — to calibrate the test difficulty
- Learning goal question: "Why are you learning Spanish?" (relocating to Spain, travel, work, DELE exam, hobby) — shapes topic priorities and exercise themes
- Quick, engaging assessment (dynamic mix of interactive exercises and conversation — should feel fun, not like an exam)
- Result: specific gap map + general A1-C2 reference level
- First topic proposals based on assessment results
- Grammar reference: `docs/grammar/` (A1-C2 topic tree based on Instituto Cervantes)

### 2. Personal Program
- AI generates short modules (5-10 lessons each)
- User chooses which module to start with from AI-proposed options
- User can request focus on specific topics (e.g., "I want to work on tenses this week")
- Program adapts based on mistakes and progress
- Mistakes are categorized: grammar, vocabulary, word order — categories drive future lesson selection

### 3. Home Screen (between lessons)
- **Quick start** — short review of previous material + today's suggested topics to choose from
- **New topics** — browse and pick new modules/themes
- **Deep review** — mixed exercises from past topics, ability to retest specific areas
- **Progress dashboard** — per-topic success indicators (e.g., "Subjunctive — great", "Past tenses — needs more practice")
- **Phrase of the day** — popular Spanish idiom/expression with explanation, tied to streak

### 4. Lesson Structure
- Lessons are built from **5-minute blocks** (3-4 blocks per session). A block is a **content unit** (3-5 exercises + explanation), not a real-time timer. "5 minutes" is a target content volume guideline for AI generation, not enforced in UI
- Easy to complete one block when short on time; more blocks = deeper topic coverage
- Each lesson starts with a short review of previous topics
- New material with explanations in context
- Interactive exercises within the lesson
- Celestia corrects mistakes and explains why
- Popular Spanish phrases and expressions woven into lessons
- **Contextual hints on errors** — not just "wrong, correct answer is X", but a pre-generated mini-explanation of the rule (generated as part of the exercise JSON, field `explanation`) + "Review this topic" button that adds the topic to curriculum. No additional AI call at error time — hints are part of the exercise payload

### 5. Interactive Exercise Interface
Core interactive element types (Duolingo/Skyeng style):
- **Gap fill** — choose the correct word/form to complete a sentence
- **Multiple choice** — select the right answer from options
- **Match pairs** — connect words with translations or phrases with meanings
- **Reorder words** — arrange words to form a correct sentence
- **Free writing** — type a translation or answer, AI evaluates
- **Reading comprehension** — read a text, answer questions about it

All exercises are generated dynamically by AI based on:
- Current lesson topic
- User's interests (learned over time from conversations)
- Previous mistakes and weak areas

Post-MVP exercise types: listening, speaking (voice input)

### 6. Chat with Celestia
- Free conversation about anything — culture of Spanish-speaking countries, how to flirt, food, travel, daily situations, hobbies
- Celestia uses popular Spanish phrases and idioms naturally in conversation
- Real-time mistake correction with explanations
- Suggests more native-sounding alternatives
- Conversation topics and mistakes feed into the personal program
- User interests discovered through chat shape future exercise content
- **Situation mode** — structured short role-play scenarios: "You're in a restaurant in Madrid", "You're at a job interview", "You're meeting someone new". More focused than free chat, with specific vocabulary goals

### 7. Spaced Repetition
- Review scheduling based on increasing intervals (1 day → 3 days → 7 days → 30 days)
- Applied to both grammar topics and vocabulary
- Built into the existing review flow — not a separate feature, but the algorithm behind "Deep review" and flashcards
- Topics/words the user gets wrong reset to shorter intervals

### 8. Mistake Journal
- Screen showing the user's typical errors, grouped by category (grammar, vocabulary, word order)
- Pattern detection: "You confuse ser/estar in 40% of cases", "Subjunctive after cuando — 3 mistakes this week"
- Direct links to review the relevant topics
- Visible progress: how error rates change over time

### 9. Personal Vocabulary
- New words encountered in lessons and chats are automatically collected into a personal dictionary
- Flashcard-style review of saved vocabulary
- Words grouped by topic and lesson

### 10. Progress & Gamification
- Lessons completed counter
- Accuracy percentage
- Streak counter (daily practice)
- Phrase of the day (tied to streak, shown on home screen)

## AI Content Validation (MVP)

- Strong system prompt with hard Castellano rules (vosotros, Spain vocabulary, distinción)
- Structured output (JSON schemas for exercises) via Claude tool_use
- Self-verification: Claude checks its own output in the same prompt (confidence scoring)
- Latin American vocabulary blocklist (~200 terms: computadora→ordenador, carro→coche, etc.)
- LanguageTool Cloud API for grammar checking (free tier, 20 req/min)
- "Report an error" button on every exercise — user feedback loop
- Pre-generated and reviewed assessment exercises (highest stakes content)

Post-MVP validation:
- Deterministic conjugation lookup table (500 irregular verbs, JSON)
- Self-hosted LanguageTool (Docker, no rate limits)
- Dual-model verification for grammar explanations
- Content review queue with admin UI

## Conversation Data Strategy

- Do NOT store full conversation history — no `ChatMessage` database model
- Chat messages exist only in-memory during the active session
- After each conversation, a Server Action extracts and stores structured insights:
  - `UserInterest` records (topic, confidence, source)
  - `MistakeEntry` records (category, pattern, related topic)
- This data feeds into program adaptation and exercise personalization

## Post-MVP Features

### Teacher/Tutor Account
- "Tutor" account type
- Manage students
- Create homework exercises
- Review student results and progress

### Expanded Content
- Russian interface language
- Listening exercises
- Speaking exercises (voice input)
- Public leaderboard
- Real-world content (Spanish news, song lyrics, memes, recipes) as reading comprehension material
- Meme on the app start screen
- Machine-readable grammar curriculum (`docs/grammar/topics.json` with `topicId`, `level`, `prerequisites`, `tags`) for deterministic curriculum engine

### Weekly Report
- Weekly summary from Celestia: lessons completed, accuracy, words learned, weak spots, focus suggestion for next week

### Notifications & Engagement
- PWA for mobile experience
- Push notifications for streak reminders
- Mini-lessons in push notifications ("¿Cómo se dice 'я опаздываю'?" — answer directly in notification)

## MVP Roadmap

9 phases from foundation to deployment. **Single source of truth**: [`docs/plan/`](plan/README.md)