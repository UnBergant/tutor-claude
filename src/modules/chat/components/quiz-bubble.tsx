"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useChatStore } from "../store";
import type { QuizMessage, QuizQuestion } from "../types";

// ---------------------------------------------------------------------------
// QuizBubble — carousel of quiz questions inside the chat
// ---------------------------------------------------------------------------

interface QuizBubbleProps {
  message: QuizMessage;
}

/**
 * Inline quiz carousel inside the chat stream.
 *
 * Shows one question at a time with progress dots. After answering,
 * user clicks "Next" to advance. After all questions — summary score.
 */
export function QuizBubble({ message }: QuizBubbleProps) {
  const { questions, currentIndex } = message;
  const correctCount = questions.filter((q) => q.status === "correct").length;
  // Summary shown only after user clicks past the last question
  const showSummary = currentIndex >= questions.length;
  const currentQuestion = questions[currentIndex];

  // Determine card border color based on state
  const borderClass = showSummary
    ? "border-border bg-card"
    : currentQuestion?.status === "correct"
      ? "border-green-500/50 bg-green-500/10"
      : currentQuestion.status === "incorrect"
        ? "border-amber-500/50 bg-amber-500/10"
        : "border-border bg-card animate-pulse-border";

  return (
    <div className="flex animate-fade-in justify-start">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 text-sm sm:max-w-[75%]",
          borderClass,
        )}
      >
        {/* Header with progress */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true">{"🧠"}</span>
            <span className="font-medium">Quick Quiz</span>
          </div>
          <ProgressDots
            total={questions.length}
            current={currentIndex}
            questions={questions}
          />
        </div>

        {showSummary ? (
          <QuizSummary correctCount={correctCount} total={questions.length} />
        ) : (
          <QuestionCard
            messageId={message.id}
            question={currentQuestion}
            questionIndex={currentIndex}
            isLast={currentIndex === questions.length - 1}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressDots — visual progress indicator
// ---------------------------------------------------------------------------

function ProgressDots({
  total,
  current,
  questions,
}: {
  total: number;
  current: number;
  questions: QuizQuestion[];
}) {
  return (
    <div className="ml-3 flex items-center gap-1.5">
      {questions.map((q, i) => {
        return (
          <div
            key={`dot-${q.question.slice(0, 10)}`}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              q.status === "correct" && "bg-green-500",
              q.status === "incorrect" && "bg-amber-500",
              q.status === "pending" && i === current && "bg-primary",
              q.status === "pending" &&
                i !== current &&
                "bg-muted-foreground/30",
            )}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionCard — single question within the carousel
// ---------------------------------------------------------------------------

function QuestionCard({
  messageId,
  question,
  questionIndex,
  isLast,
}: {
  messageId: string;
  question: QuizQuestion;
  questionIndex: number;
  isLast: boolean;
}) {
  const { status, quizType } = question;
  const answered = status !== "pending";

  return (
    <>
      {/* Question text */}
      <p className="text-base font-semibold leading-snug">
        {question.question}
      </p>

      {/* MC options */}
      {quizType === "multiple_choice" && question.options && (
        <McOptions
          messageId={messageId}
          questionIndex={questionIndex}
          options={question.options}
          correctAnswer={question.correctAnswer}
          status={status}
          userAnswer={question.userAnswer}
        />
      )}

      {/* Gap fill: pending hint */}
      {quizType === "gap_fill" && status === "pending" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Type your answer below...
        </p>
      )}

      {/* Result + Next button (after answering) */}
      {answered && (
        <>
          <ResultFooter
            status={status as "correct" | "incorrect"}
            userAnswer={question.userAnswer}
            correctAnswer={question.correctAnswer}
            explanation={question.explanation}
            quizType={quizType}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="xs"
              variant="outline"
              onClick={() => useChatStore.getState().advanceQuiz(messageId)}
            >
              {isLast ? "See results" : "Next"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// McOptions — clickable option buttons for multiple choice
// ---------------------------------------------------------------------------

function McOptions({
  messageId,
  questionIndex,
  options,
  correctAnswer,
  status,
  userAnswer,
}: {
  messageId: string;
  questionIndex: number;
  options: string[];
  correctAnswer: string;
  status: "pending" | "correct" | "incorrect";
  userAnswer?: string;
}) {
  const handleSelect = (option: string) => {
    if (status !== "pending") return;
    const correct = option.trim() === correctAnswer.trim();
    useChatStore
      .getState()
      .answerQuizQuestion(
        messageId,
        questionIndex,
        correct ? "correct" : "incorrect",
        option,
      );
  };

  const answered = status !== "pending";

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {options.map((option) => {
        const isSelected = userAnswer === option;
        const isCorrectOption = option.trim() === correctAnswer.trim();

        return (
          <button
            key={option}
            type="button"
            disabled={answered}
            onClick={() => handleSelect(option)}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              !answered &&
                "border-border bg-background cursor-pointer hover:border-primary/30 hover:bg-primary/10",
              answered &&
                isCorrectOption &&
                "border-green-500/50 bg-green-500/10",
              answered &&
                isSelected &&
                !isCorrectOption &&
                "border-amber-500/50 bg-amber-500/10",
              answered && !isSelected && !isCorrectOption && "opacity-50",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResultFooter — shown after answering
// ---------------------------------------------------------------------------

function ResultFooter({
  status,
  userAnswer,
  correctAnswer,
  explanation,
  quizType,
}: {
  status: "correct" | "incorrect";
  userAnswer?: string;
  correctAnswer: string;
  explanation?: string;
  quizType: string;
}) {
  return (
    <div className="mt-2.5 space-y-1">
      {status === "correct" ? (
        <p className="text-xs font-medium text-green-600">{"✓ "}Correct!</p>
      ) : (
        <div className="space-y-0.5">
          {userAnswer && quizType === "gap_fill" && (
            <p className="text-xs text-muted-foreground line-through">
              {userAnswer}
            </p>
          )}
          <p className="text-xs font-medium text-amber-600">
            Correct answer:{" "}
            <span className="font-semibold">{correctAnswer}</span>
          </p>
        </div>
      )}
      {explanation && (
        <p className="mt-1 text-xs text-muted-foreground italic">
          {explanation}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizSummary — shown after all questions answered
// ---------------------------------------------------------------------------

/**
 * Loading placeholder shown while quiz tool_use is streaming.
 */
export function QuizLoadingSkeleton() {
  return (
    <div className="flex animate-fade-in justify-start">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true">{"🧠"}</span>
          <span className="font-medium">Quick Quiz</span>
        </div>
        <div className="flex items-center gap-1 py-1">
          <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:0ms]" />
          <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:150ms]" />
          <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuizSummary({
  correctCount,
  total,
}: {
  correctCount: number;
  total: number;
}) {
  const allCorrect = correctCount === total;
  return (
    <div className="py-1 text-center">
      <p className="text-lg font-bold">
        {correctCount}/{total}
      </p>
      <p className="text-xs text-muted-foreground">
        {allCorrect
          ? "Perfect score!"
          : correctCount >= total / 2
            ? "Good job! Keep practicing."
            : "Keep going, you'll get there!"}
      </p>
    </div>
  );
}
