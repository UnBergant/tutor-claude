import type { TopicAssessment } from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";

// ──────────────────────────────────────────────
// Module Proposal prompt
// ──────────────────────────────────────────────

interface ModuleProposalContext {
  gapMap: TopicAssessment[];
  userLevel: CEFRLevel;
  learningGoal: string;
  recentMistakes: { category: string; pattern: string; count: number }[];
}

/**
 * Build prompt for proposing 3-4 learning modules based on assessment results.
 * Gap map is summarized by level to keep the prompt compact.
 */
export function buildModuleProposalPrompt(ctx: ModuleProposalContext): string {
  // Summarize gap map by level
  const summary: Record<
    string,
    {
      mastered: number;
      notMastered: number;
      untested: number;
      topics: string[];
    }
  > = {};
  for (const item of ctx.gapMap) {
    if (!summary[item.level]) {
      summary[item.level] = {
        mastered: 0,
        notMastered: 0,
        untested: 0,
        topics: [],
      };
    }
    const s = summary[item.level];
    if (item.status === "mastered") s.mastered++;
    else if (item.status === "not_mastered") {
      s.notMastered++;
      s.topics.push(item.topicId);
    } else {
      s.untested++;
      s.topics.push(item.topicId);
    }
  }

  const gapSummary = Object.entries(summary)
    .map(([level, s]) => {
      const topicList =
        s.topics.length > 0
          ? ` — needs work: ${s.topics.slice(0, 8).join(", ")}${s.topics.length > 8 ? "..." : ""}`
          : "";
      return `${level}: ${s.mastered} mastered, ${s.notMastered} not mastered, ${s.untested} untested${topicList}`;
    })
    .join("\n");

  const mistakeSection =
    ctx.recentMistakes.length > 0
      ? `\n\n**Top mistakes** (recurring patterns):\n${ctx.recentMistakes
          .slice(0, 10)
          .map((m) => `- [${m.category}] ${m.pattern} (×${m.count})`)
          .join("\n")}`
      : "";

  return `Propose 3-4 learning modules for a student studying Peninsular Spanish (Castellano).

**Student level**: ${ctx.userLevel}
**Learning goal**: ${ctx.learningGoal}

**Gap map summary** (from placement assessment):
${gapSummary}${mistakeSection}

Requirements:
- Each module focuses on ONE grammar topic from the gap map
- Prioritize: not_mastered topics at the student's level > untested topics near their level > topics addressing recurring mistakes
- Each module should have 2-4 lessons
- Module titles should be clear and motivating (in English)
- Descriptions should explain what the student will learn (1-2 sentences, English)
- topicId must be an exact ID from the gap map above
- level must match the topic's CEFR level

Return exactly 3-4 modules. Order them by priority (most important first).`;
}

// ──────────────────────────────────────────────
// Lesson Generation prompt
// ──────────────────────────────────────────────

interface LessonGenerationContext {
  topicTitle: string;
  topicDescription: string;
  topicLevel: CEFRLevel;
  lessonOrder: number;
  totalLessons: number;
  moduleTitle: string;
  previousTopics: string[];
  userLevel: CEFRLevel;
}

/**
 * Build prompt for generating a single lesson's structure (blocks + explanations).
 * Each lesson has 2-3 blocks: REVIEW (lesson 2+) and NEW_MATERIAL.
 */
export function buildLessonGenerationPrompt(
  ctx: LessonGenerationContext,
): string {
  const isFirstLesson = ctx.lessonOrder === 1;
  const reviewClause = isFirstLesson
    ? "This is the FIRST lesson — no REVIEW block needed."
    : `This is lesson ${ctx.lessonOrder} of ${ctx.totalLessons}. Start with a REVIEW block covering: ${ctx.previousTopics.join(", ")}.`;

  return `Generate a structured Spanish grammar lesson for Castellano (Peninsular Spanish).

**Module**: ${ctx.moduleTitle}
**Topic**: ${ctx.topicTitle} (${ctx.topicLevel})
**Topic description**: ${ctx.topicDescription}
**Student level**: ${ctx.userLevel}
**Lesson**: ${ctx.lessonOrder} of ${ctx.totalLessons}

${reviewClause}

Requirements:
- Generate a lesson title (short, descriptive, in English)
- Generate a brief description (1 sentence, English)
- Generate 2-3 blocks:
  ${isFirstLesson ? "- 1-2 NEW_MATERIAL blocks" : "- 1 REVIEW block (first), then 1-2 NEW_MATERIAL blocks"}
- Each block needs:
  - type: "REVIEW" or "NEW_MATERIAL"
  - title: short block title in English (e.g., "Review: Present Tense Basics", "New: Irregular Verbs")
  - explanation: grammar explanation in Markdown format (English text, Spanish examples)
    - Use headers, bullet points, bold, and code blocks for Spanish examples
    - Include 3-5 example sentences with translations
    - Explain the rule clearly for a ${ctx.userLevel} student
    - Use Castellano forms (vosotros, distinción, Peninsular vocabulary)
  - exerciseCount: how many exercises for this block (2-4)
  - exerciseTypes: array of "gap_fill" and/or "multiple_choice"

Keep explanations focused and practical — students want to practice, not read textbooks.`;
}

// ──────────────────────────────────────────────
// JSON schemas for tool_use output
// ──────────────────────────────────────────────

export const MODULE_PROPOSAL_SCHEMA = {
  type: "object" as const,
  properties: {
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Module title in English" },
          description: {
            type: "string",
            description: "1-2 sentence description in English",
          },
          topicId: {
            type: "string",
            description: "Exact topic ID from the gap map",
          },
          level: { type: "string", description: "CEFR level (A1-C2)" },
          lessonCount: {
            type: "integer",
            minimum: 2,
            maximum: 4,
            description: "Number of lessons",
          },
        },
        required: ["title", "description", "topicId", "level", "lessonCount"],
      },
      minItems: 3,
      maxItems: 4,
      description: "Proposed learning modules",
    },
  },
  required: ["modules"],
};

export const LESSON_GENERATION_SCHEMA = {
  type: "object" as const,
  properties: {
    title: { type: "string", description: "Lesson title in English" },
    description: {
      type: "string",
      description: "Brief description (1 sentence)",
    },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["REVIEW", "NEW_MATERIAL"],
            description: "Block type",
          },
          title: { type: "string", description: "Block title in English" },
          explanation: {
            type: "string",
            description:
              "Grammar explanation in Markdown (English + Spanish examples)",
          },
          exerciseCount: {
            type: "integer",
            minimum: 2,
            maximum: 4,
            description: "Number of exercises",
          },
          exerciseTypes: {
            type: "array",
            items: { type: "string", enum: ["gap_fill", "multiple_choice"] },
            minItems: 1,
            description: "Types of exercises for this block",
          },
        },
        required: [
          "type",
          "title",
          "explanation",
          "exerciseCount",
          "exerciseTypes",
        ],
      },
      minItems: 2,
      maxItems: 3,
      description: "Lesson blocks (REVIEW + NEW_MATERIAL)",
    },
  },
  required: ["title", "description", "blocks"],
};

// ──────────────────────────────────────────────
// Generated data types
// ──────────────────────────────────────────────

export interface GeneratedModuleProposal {
  modules: {
    title: string;
    description: string;
    topicId: string;
    level: string;
    lessonCount: number;
  }[];
}

export interface GeneratedLessonBlock {
  type: "REVIEW" | "NEW_MATERIAL";
  title: string;
  explanation: string;
  exerciseCount: number;
  exerciseTypes: ("gap_fill" | "multiple_choice")[];
}

export interface GeneratedLesson {
  title: string;
  description: string;
  blocks: GeneratedLessonBlock[];
}
