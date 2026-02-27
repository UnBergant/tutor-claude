/**
 * Shared sanitization helpers for AI-generated exercises.
 * Used by both assessment and exercise modules.
 */

/** Minimal shape for MC sanitization (both assessment and exercise types satisfy this) */
interface MultipleChoiceData {
  prompt: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
}

/** Re-split gap-fill if AI included underscores/blanks in before/after */
export function sanitizeGapFill(
  before: string,
  after: string,
): { before: string; after: string } {
  const blankPattern = /_{2,}|\.{3,}|…/;
  const beforeMatch = blankPattern.exec(before);
  const afterMatch = blankPattern.exec(after);

  if (beforeMatch) {
    const realBefore = before.slice(0, beforeMatch.index);
    const rest = before.slice(beforeMatch.index + beforeMatch[0].length);
    return { before: realBefore, after: rest + after };
  }

  if (afterMatch) {
    const rest = after.slice(0, afterMatch.index);
    const realAfter = after.slice(afterMatch.index + afterMatch[0].length);
    return { before: before + rest, after: realAfter };
  }

  return { before, after };
}

/**
 * De-duplicate MC options and fix answer leaking in prompt.
 * Returns a new object with sanitized prompt, options, and correctAnswer.
 */
export function sanitizeMultipleChoice<T extends MultipleChoiceData>(
  data: T,
): T {
  const seen = new Set<string>();
  const options = data.options.map((opt) => {
    let unique = opt;
    let suffix = 2;
    while (seen.has(unique)) {
      unique = `${opt} (${suffix})`;
      suffix++;
    }
    seen.add(unique);
    return unique;
  });

  let prompt = data.prompt;
  const blankIdx = prompt.indexOf("___");
  if (blankIdx !== -1) {
    const afterBlank = prompt.slice(blankIdx + 3).trim();
    const correctAnswer = options[data.correctIndex];
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const afterWords = afterBlank.toLowerCase().split(/\s+/);

    let leakedCount = 0;
    for (let i = 0; i < afterWords.length && i < correctWords.length; i++) {
      const afterClean = afterWords[i].replace(/[.,;:!?]/g, "");
      if (correctWords.includes(afterClean)) {
        leakedCount++;
      } else {
        break;
      }
    }
    if (leakedCount > 0) {
      const afterBlankWords = afterBlank.split(/\s+/);
      const cleaned = afterBlankWords.slice(leakedCount).join(" ");
      prompt = `${prompt.slice(0, blankIdx + 3)} ${cleaned}`;
    }
  }

  return {
    ...data,
    prompt,
    options,
    correctAnswer: options[data.correctIndex],
  };
}

/** Check if hint reveals the answer (should be suppressed) */
export function hintMatchesAnswer(
  hint: string,
  correctAnswer: string,
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return normalize(hint) === normalize(correctAnswer);
}
