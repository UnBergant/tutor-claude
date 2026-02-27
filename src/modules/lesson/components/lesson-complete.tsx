"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import type { LessonCompleteResult } from "../actions";

interface LessonCompleteProps {
  lessonTitle: string;
  blockScores: { correct: number; total: number }[];
  blockTitles: string[];
  result: LessonCompleteResult | null;
  isCompleting: boolean;
  onComplete: () => void;
  moduleId?: string;
}

export function LessonComplete({
  lessonTitle,
  blockScores,
  blockTitles,
  result,
  isCompleting,
  onComplete,
  moduleId,
}: LessonCompleteProps) {
  const overallCorrect = blockScores.reduce((a, s) => a + s.correct, 0);
  const overallTotal = blockScores.reduce((a, s) => a + s.total, 0);
  const overallPercentage =
    overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{lessonTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall score */}
          <div className="text-center space-y-2">
            <div className="text-5xl">
              {overallPercentage >= 80
                ? "🎉"
                : overallPercentage >= 50
                  ? "👍"
                  : "💪"}
            </div>
            <p className="text-2xl font-bold">{overallPercentage}%</p>
            <p className="text-muted-foreground">
              {overallCorrect} of {overallTotal} correct
            </p>
          </div>

          {/* Per-block breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Block Breakdown
            </h4>
            {blockScores.map((score, i) => {
              const pct =
                score.total > 0
                  ? Math.round((score.correct / score.total) * 100)
                  : 0;
              return (
                <div key={blockTitles[i]} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{blockTitles[i]}</span>
                    <span className="text-muted-foreground">
                      {score.correct}/{score.total}
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </div>

          {/* Next review date */}
          {result && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Next review scheduled:
              </p>
              <p className="font-medium">{formatDate(result.nextReviewAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!result ? (
          <Button
            onClick={onComplete}
            disabled={isCompleting}
            className="w-full"
            size="lg"
          >
            {isCompleting ? "Saving..." : "Complete Lesson"}
          </Button>
        ) : (
          <>
            {moduleId && (
              <Link href={`/lessons`}>
                <Button className="w-full" size="lg">
                  Back to Lessons
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
