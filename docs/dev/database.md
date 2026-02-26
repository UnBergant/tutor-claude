# Database Schema Specification

PostgreSQL (Neon) with Prisma ORM.

## Enums

### AssessmentStatus
- `IN_PROGRESS`
- `COMPLETED`

### LessonStatus
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

### ExerciseType
- `GAP_FILL`
- `MULTIPLE_CHOICE`
- `MATCH_PAIRS`
- `REORDER_WORDS`
- `FREE_WRITING`
- `READING_COMPREHENSION`

### BlockType
- `REVIEW`
- `NEW_MATERIAL`

### VocabSource
- `LESSON`
- `CHAT`

### MistakeCategory
- `GRAMMAR`
- `VOCABULARY`
- `WORD_ORDER`

## Models

### Auth.js Required (4)

#### User
Auth.js managed model. Extended with application relations.

| Field            | Type      | Notes                        |
|------------------|-----------|------------------------------|
| id               | String    | cuid, PK                    |
| name             | String?   | from OAuth                   |
| email            | String?   | unique                       |
| emailVerified    | DateTime? | Auth.js                      |
| image            | String?   | avatar URL                   |
| createdAt        | DateTime  | default now()                |
| updatedAt        | DateTime  | @updatedAt                   |

Relations: Account[], Session[], UserProfile?, Assessment[], Module[], LessonProgress[], ExerciseAttempt[], VocabularyWord[], MistakeEntry[], UserInterest[], AiUsage[], AiLimits?

#### Account
Auth.js managed. Stores OAuth provider tokens.

| Field                | Type    | Notes                             |
|----------------------|---------|-----------------------------------|
| id                   | String  | cuid, PK                         |
| userId               | String  | FK → User                        |
| type                 | String  |                                   |
| provider             | String  |                                   |
| providerAccountId    | String  |                                   |
| refresh_token        | String? |                                   |
| access_token         | String? |                                   |
| expires_at           | Int?    |                                   |
| token_type           | String? |                                   |
| scope                | String? |                                   |
| id_token             | String? |                                   |
| session_state        | String? |                                   |

Unique: (provider, providerAccountId)

#### Session
Auth.js managed. Not used with JWT strategy but required by adapter.

| Field        | Type     | Notes          |
|--------------|----------|----------------|
| id           | String   | cuid, PK      |
| sessionToken | String   | unique         |
| userId       | String   | FK → User      |
| expires      | DateTime |                |

#### VerificationToken
Auth.js managed. For email/passwordless flows (future).

| Field      | Type     | Notes                     |
|------------|----------|---------------------------|
| identifier | String   |                           |
| token      | String   | unique                    |
| expires    | DateTime |                           |

Unique: (identifier, token)

### Application Models (12)

#### UserProfile
One per user. Stores preferences, level, and streak data.

| Field            | Type     | Notes                                  |
|------------------|----------|----------------------------------------|
| id               | String   | cuid, PK                              |
| userId           | String   | unique, FK → User                      |
| currentLevel     | String   | A1–C2, default "A1"                   |
| learningGoal     | String?  | free text or enum in app layer         |
| interfaceLanguage| String   | default "en"                           |
| lastActivityDate | DateTime?| for streak calculation                 |
| currentStreak    | Int      | default 0                              |
| longestStreak    | Int      | default 0                              |
| lessonsCompleted | Int      | default 0                              |
| totalXp          | Int      | default 0, gamification (Phase 5)      |
| createdAt        | DateTime | default now()                          |
| updatedAt        | DateTime | @updatedAt                             |

Index: userId (unique)

#### Assessment
Adaptive placement test. One active per user at a time.

| Field          | Type             | Notes                    |
|----------------|------------------|--------------------------|
| id             | String           | cuid, PK                |
| userId         | String           | FK → User                |
| status         | AssessmentStatus | default IN_PROGRESS      |
| determinedLevel| String?          | A1–C2, set on completion |
| confidence     | Float?           | 0–100, set on completion |
| questionsAsked | Int              | default 0                |
| startedAt      | DateTime         | default now()            |
| completedAt    | DateTime?        |                          |

Relations: AssessmentAnswer[]
Index: (userId, status)

#### AssessmentAnswer
Individual answer in an assessment.

| Field        | Type     | Notes               |
|--------------|----------|----------------------|
| id           | String   | cuid, PK            |
| assessmentId | String   | FK → Assessment      |
| topicId      | String   | grammar topic ref    |
| level        | String   | A1–C2                |
| question     | String   | the question text    |
| userAnswer   | String   |                      |
| correctAnswer| String   |                      |
| isCorrect    | Boolean  |                      |
| createdAt    | DateTime | default now()        |

Index: assessmentId

#### Module
AI-generated curriculum unit grouping lessons.

| Field       | Type     | Notes              |
|-------------|----------|--------------------|
| id          | String   | cuid, PK          |
| userId      | String   | FK → User          |
| title       | String   |                    |
| description | String?  |                    |
| topicId     | String   | grammar topic ref  |
| level       | String   | A1–C2              |
| order       | Int      | sequence for user  |
| createdAt   | DateTime | default now()      |
| updatedAt   | DateTime | @updatedAt         |

Relations: Lesson[]
Index: userId

#### Lesson
Single lesson within a module.

| Field            | Type     | Notes                   |
|------------------|----------|-------------------------|
| id               | String   | cuid, PK               |
| moduleId         | String   | FK → Module             |
| title            | String   |                         |
| description      | String?  |                         |
| topicId          | String   | grammar topic ref       |
| estimatedMinutes | Int      | default 15              |
| order            | Int      | sequence in module      |
| createdAt        | DateTime | default now()           |
| updatedAt        | DateTime | @updatedAt              |

Relations: LessonBlock[], LessonProgress[], Exercise[]
Index: moduleId

#### LessonBlock
5-minute content unit within a lesson.

| Field    | Type      | Notes              |
|----------|-----------|--------------------|
| id       | String    | cuid, PK          |
| lessonId | String    | FK → Lesson        |
| type     | BlockType |                    |
| content  | String    | markdown/JSON      |
| order    | Int       | sequence in lesson |
| createdAt| DateTime  | default now()      |

Relations: Exercise[]
Index: lessonId

#### LessonProgress
Per-user progress on a lesson. Includes SRS fields for grammar topic spaced repetition.

| Field        | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | String       | cuid, PK                      |
| userId       | String       | FK → User                      |
| lessonId     | String       | FK → Lesson                    |
| status       | LessonStatus | default NOT_STARTED            |
| score        | Float?       | accuracy %, set on completion  |
| nextReviewAt | DateTime?    | SRS: next review date          |
| interval     | Int          | SRS: days until next review, default 1 |
| completedAt  | DateTime?    |                                |
| createdAt    | DateTime     | default now()                  |
| updatedAt    | DateTime     | @updatedAt                     |

Unique: (userId, lessonId)
Index: (userId, nextReviewAt)

#### Exercise
Generated exercise attached to a lesson or lesson block.

| Field         | Type         | Notes                     |
|---------------|--------------|---------------------------|
| id            | String       | cuid, PK                 |
| lessonId      | String       | FK → Lesson               |
| lessonBlockId | String?      | FK → LessonBlock, optional|
| type          | ExerciseType |                           |
| question      | String       |                           |
| content       | Json         | exercise data (options, pairs, etc.) |
| correctAnswer | String       |                           |
| explanation   | String?      | AI-generated hint         |
| order         | Int          | sequence in block/lesson  |
| createdAt     | DateTime     | default now()             |

Relations: ExerciseAttempt[]
Index: lessonId, lessonBlockId

#### ExerciseAttempt
User's answer to an exercise.

| Field      | Type             | Notes               |
|------------|------------------|----------------------|
| id         | String           | cuid, PK            |
| userId     | String           | FK → User            |
| exerciseId | String           | FK → Exercise        |
| userAnswer | String           |                      |
| isCorrect  | Boolean          |                      |
| category   | MistakeCategory? | if incorrect         |
| feedback   | String?          | AI-generated         |
| createdAt  | DateTime         | default now()        |

Index: (userId, exerciseId)

#### VocabularyWord
User's personal vocabulary with SRS fields.

| Field       | Type       | Notes                              |
|-------------|------------|------------------------------------|
| id          | String     | cuid, PK                          |
| userId      | String     | FK → User                          |
| word        | String     | Spanish word                       |
| translation | String     | English translation                |
| context     | String?    | example sentence                   |
| source      | VocabSource|                                    |
| nextReviewAt| DateTime?  | SRS: next review date              |
| interval    | Int        | SRS: days, default 1               |
| easeFactor  | Float      | SRS: difficulty factor, default 2.5|
| repetitions | Int        | SRS: successful reviews, default 0 |
| createdAt   | DateTime   | default now()                      |
| updatedAt   | DateTime   | @updatedAt                         |

Unique: (userId, word)
Index: (userId, nextReviewAt)

#### MistakeEntry
Aggregated mistake pattern from exercises and chat.

| Field          | Type            | Notes              |
|----------------|-----------------|---------------------|
| id             | String          | cuid, PK           |
| userId         | String          | FK → User           |
| category       | MistakeCategory |                     |
| pattern        | String          | mistake description |
| count          | Int             | default 1           |
| relatedTopicId | String?         | grammar topic ref   |
| lastOccurred   | DateTime        | default now()       |
| createdAt      | DateTime        | default now()       |

Index: (userId, category)

#### UserInterest
Topics/interests extracted from chat and exercises.

| Field        | Type     | Notes                         |
|--------------|----------|-------------------------------|
| id           | String   | cuid, PK                     |
| userId       | String   | FK → User                     |
| topic        | String   | interest topic                |
| confidence   | Int      | 0–100, default 50            |
| source       | String   | "chat" or "exercise"         |
| mentionCount | Int      | default 1                     |
| lastMentioned| DateTime | default now()                 |
| createdAt    | DateTime | default now()                 |
| updatedAt    | DateTime | @updatedAt                    |

Index: userId

### AI Rate Limiting (3)

#### AiUsage
Per-request token usage log.

| Field       | Type     | Notes              |
|-------------|----------|--------------------|
| id          | String   | cuid, PK          |
| userId      | String   | FK → User          |
| endpoint    | String   | e.g. "assessment"  |
| model       | String   | e.g. "haiku"       |
| tokensInput | Int      |                    |
| tokensOutput| Int      |                    |
| createdAt   | DateTime | default now()      |

Index: (userId, createdAt)

#### AiLimits
Per-user rate limits (override global defaults).

| Field        | Type     | Notes               |
|--------------|----------|----------------------|
| id           | String   | cuid, PK            |
| userId       | String   | unique, FK → User    |
| dailyLimit   | Int      | tokens per day       |
| monthlyLimit | Int      | tokens per month     |
| createdAt    | DateTime | default now()        |
| updatedAt    | DateTime | @updatedAt           |

#### AiSettings
Global defaults per endpoint. Seeded on deploy.

| Field        | Type     | Notes                       |
|--------------|----------|-----------------------------|
| id           | String   | cuid, PK                   |
| endpoint     | String   | unique, e.g. "assessment"   |
| model        | String   | default model for endpoint  |
| dailyLimit   | Int      | global daily token limit    |
| monthlyLimit | Int      | global monthly token limit  |
| updatedAt    | DateTime | @updatedAt                  |

## Design Decisions

1. **No ChatMessage model** — per Conversation Data Strategy (Phase 4), chat is in-memory only. Extracted insights stored as MistakeEntry + UserInterest.
2. **Unified MistakeEntry** — single name used across PRODUCT.md and all phase docs (not MistakePattern).
3. **Streak fields on UserProfile** — `lastActivityDate`, `currentStreak`, `longestStreak` for gamification (Phase 5).
4. **SRS on LessonProgress** — `nextReviewAt`, `interval` for grammar topic spaced repetition (no separate TopicMastery model).
5. **SRS on VocabularyWord** — `nextReviewAt`, `interval`, `easeFactor`, `repetitions` for vocabulary spaced repetition (SM-2 variant).
6. **String enums for levels/goals** — `currentLevel` and `learningGoal` are stored as String rather than Prisma enums. This avoids migrations when adding new values.
7. **AI rate limiting** — AiSettings are global defaults, AiLimits are per-user overrides. AiUsage logs every request for auditing.
