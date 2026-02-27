"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import type { LessonCompleteResult } from "../actions";

interface BlockScoreEntry {
  title: string;
  correct: number;
  total: number;
}

interface LessonCompleteProps {
  lessonTitle: string;
  blockScores: BlockScoreEntry[];
  result: LessonCompleteResult | null;
  isCompleting: boolean;
  onComplete: () => void;
  showBackButton?: boolean;
}

export function LessonComplete({
  lessonTitle,
  blockScores,
  result,
  isCompleting,
  onComplete,
  showBackButton,
}: LessonCompleteProps) {
  const overallCorrect = blockScores.reduce((a, s) => a + s.correct, 0);
  const overallTotal = blockScores.reduce((a, s) => a + s.total, 0);
  const overallPercentage =
    overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

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
            {blockScores.map((entry) => {
              const pct =
                entry.total > 0
                  ? Math.round((entry.correct / entry.total) * 100)
                  : 0;
              return (
                <div key={entry.title} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{entry.title}</span>
                    <span className="text-muted-foreground">
                      {entry.correct}/{entry.total}
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
              <p className="font-medium">
                {new Date(result.nextReviewAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
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
            {showBackButton && (
              <Link href="/lessons">
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
