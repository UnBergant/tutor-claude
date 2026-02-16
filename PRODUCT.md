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
- Interface language: Russian (MVP), English (future)
- Target language: Spanish (MVP)

## MVP Features

### 1. Onboarding & Assessment
- Social login (Google)
- Quick, engaging assessment (dynamic mix of interactive exercises and conversation — should feel fun, not like an exam)
- Result: specific gap map + general A1-C2 reference level
- First topic proposals based on assessment results

### 2. Personal Program
- AI generates short modules (5-10 lessons each)
- User chooses which module to start with from AI-proposed options
- User can request focus on specific topics (e.g., "I want to work on tenses this week")
- Program adapts based on mistakes and progress

### 3. Lesson Structure
- Each lesson starts with a short review of previous topics
- New material with explanations in context
- Interactive exercises within the lesson
- Celestia corrects mistakes and explains why
- Popular Spanish phrases and expressions woven into lessons

### 4. Interactive Exercise Interface
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

### 5. Chat with Celestia
- Free conversation about anything — culture of Spanish-speaking countries, how to flirt, food, travel, daily situations, hobbies
- Celestia uses popular Spanish phrases and idioms naturally in conversation
- Real-time mistake correction with explanations
- Suggests more native-sounding alternatives
- Conversation topics and mistakes feed into the personal program
- User interests discovered through chat shape future exercise content

### 6. Progress & Gamification
- Lessons completed counter
- Accuracy percentage
- Streak counter (daily practice)

## Post-MVP Features

### Teacher/Tutor Account
- "Tutor" account type
- Manage students
- Create homework exercises
- Review student results and progress

### Expanded Content
- English interface language
- Listening exercises
- Speaking exercises (voice input)
- Public leaderboard

### Platform
- PWA for mobile experience
- Push notifications for streak reminders

## MVP Roadmap

### Phase 1: Foundation
- Monorepo setup (Turborepo: Next.js + NestJS)
- Authentication (Google social login)
- Database schema design (PostgreSQL + Prisma)
- Basic UI layout (mobile-first)

### Phase 2: Assessment Engine
- Assessment flow UI (interactive, engaging)
- AI-powered question generation (Claude API)
- Gap analysis algorithm
- Level mapping (specific gaps + A1-C2 reference)
- First module proposals based on results

### Phase 3: Interactive Exercise Engine
- Exercise component library (gap fill, multiple choice, match pairs, reorder, free writing)
- Exercise generation engine (Claude API)
- Answer validation and feedback system
- Interest-based content personalization

### Phase 4: Curriculum & Lessons
- Dynamic curriculum generation
- Module/lesson structure (5-10 lessons per module)
- Lesson UI with review section + exercises
- Module selection and user override ("focus on tenses")
- Program adaptation based on mistakes

### Phase 5: Chat with Celestia
- Free conversation interface
- Real-time mistake correction
- Popular phrases and idioms usage
- Interest learning from conversations
- Conversation insights feeding into program

### Phase 6: Progress & Gamification
- Progress dashboard
- Accuracy tracking
- Streak system
- Lesson completion stats