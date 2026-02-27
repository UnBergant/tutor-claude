"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type {
  ExerciseFeedback,
  ReadingClientQuestion,
} from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface ReadingComprehensionProps {
  /** Spanish passage to read */
  passage: string;
  /** Sub-questions (correctAnswer stripped) */
  questions: ReadingClientQuestion[];
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Called when student submits all answers */
  onSubmit: (answer: string) => void;
  /** Disable interaction */
  disabled?: boolean;
}

export function ReadingComprehension({
  passage,
  questions,
  feedback,
  onSubmit,
  disabled,
}: ReadingComprehensionProps) {
  const [answers, setAnswers] = useState<(string | null)[]>([]);

  // Reset when passage changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on exercise identity change
  useEffect(() => {
    setAnswers(new Array(questions.length).fill(null));
  }, [passage, questions.length]);

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleSubmit() {
    if (answers.every((a) => a !== null && a.trim() !== "") && !disabled) {
      onSubmit(JSON.stringify(answers));
    }
  }

  const allAnswered = answers.every((a) => a !== null && a.trim() !== "");

  // Parse per-question correctness from feedback
  const perQuestionCorrect: boolean[] | null = feedback
    ? (() => {
        try {
          const correctAnswers = JSON.parse(feedback.correctAnswer) as string[];
          return answers.map((a, i) => {
            if (!a) return false;
            const normalize = (s: string) =>
              s.trim().toLowerCase().replace(/\s+/g, " ");
            return normalize(a) === normalize(correctAnswers[i]);
          });
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="space-y-5">
      {/* Passage */}
      <div className="rounded-lg border bg-muted/30 p-4 max-h-60 overflow-y-auto">
        <p className="text-base leading-relaxed whitespace-pre-line">
          {passage}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={`q-${q.type}-${q.prompt.slice(0, 30)}`}
            className="space-y-2"
          >
            <p className="text-sm font-medium">
              <span className="text-muted-foreground mr-1">Q{qIndex + 1}.</span>
              {q.prompt}
              {perQuestionCorrect && (
                <span className="ml-2">
                  {perQuestionCorrect[qIndex] ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗</span>
                  )}
                </span>
              )}
            </p>

            {/* Sub-question renderer */}
            <SubQuestion
              question={q}
              answer={answers[qIndex]}
              onAnswer={(val) => setAnswer(qIndex, val)}
              disabled={disabled || !!feedback}
              feedback={feedback}
            />
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
            feedback.isCorrect
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          )}
        >
          {!feedback.isCorrect && (
            <p className="font-medium mb-1">
              Some answers were incorrect. Review the explanations above.
            </p>
          )}
          <p>{feedback.explanation}</p>
        </div>
      )}

      {/* Submit button */}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || disabled}
          className="w-full sm:w-auto"
        >
          Submit All
        </Button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-question renderers
// ──────────────────────────────────────────────

interface SubQuestionProps {
  question: ReadingClientQuestion;
  answer: string | null;
  onAnswer: (value: string) => void;
  disabled: boolean;
  feedback: ExerciseFeedback | null;
}

function SubQuestion({
  question,
  answer,
  onAnswer,
  disabled,
  feedback,
}: SubQuestionProps) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <MCSubQuestion
          options={question.options ?? []}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
          feedback={feedback}
        />
      );
    case "true_false":
      return (
        <TrueFalseSubQuestion
          options={question.options ?? ["True", "False"]}
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
          feedback={feedback}
        />
      );
    case "gap_fill":
      return (
        <GapFillSubQuestion
          answer={answer}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}

function MCSubQuestion({
  options,
  answer,
  onAnswer,
  disabled,
  feedback,
}: {
  options: string[];
  answer: string | null;
  onAnswer: (v: string) => void;
  disabled: boolean;
  feedback: ExerciseFeedback | null;
}) {
  return (
    <div className="grid gap-1.5">
      {options.map((option, i) => {
        const isSelected = answer === option;
        return (
          <button
            key={`${i}-${option}`}
            type="button"
            onClick={() => onAnswer(option)}
            disabled={disabled}
            className={cn(
              "text-left px-3 py-2 rounded-md text-sm border transition-colors",
              isSelected && !feedback
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:border-primary/50",
              disabled && "cursor-default opacity-70",
            )}
          >
            <span className="mr-1.5 text-muted-foreground text-xs">
              {String.fromCharCode(65 + i)}.
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseSubQuestion({
  options,
  answer,
  onAnswer,
  disabled,
  feedback,
}: {
  options: string[];
  answer: string | null;
  onAnswer: (v: string) => void;
  disabled: boolean;
  feedback: ExerciseFeedback | null;
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const isSelected = answer === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium border transition-colors flex-1",
              isSelected && !feedback
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50",
              disabled && "cursor-default opacity-70",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function GapFillSubQuestion({
  answer,
  onAnswer,
  disabled,
}: {
  answer: string | null;
  onAnswer: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      value={answer ?? ""}
      onChange={(e) => onAnswer(e.target.value)}
      disabled={disabled}
      placeholder="Type your answer..."
      className="max-w-sm text-sm"
      autoComplete="off"
      spellCheck={false}
    />
  );
}
