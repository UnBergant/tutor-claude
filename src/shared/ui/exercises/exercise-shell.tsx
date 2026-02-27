"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

interface ExerciseShellProps {
  /** Current question number (1-based) */
  current: number;
  /** Total number of questions */
  total: number;
  /** Optional title override */
  title?: string;
  /** Whether to show a loading skeleton */
  loading?: boolean;
  children: React.ReactNode;
}

export function ExerciseShell({
  current,
  total,
  title,
  loading,
  children,
}: ExerciseShellProps) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {current} of {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        {title && (
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>{loading ? <ExerciseSkeleton /> : children}</CardContent>
      </Card>
    </div>
  );
}

function ExerciseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4" />
      <div className="h-10 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-1/4" />
    </div>
  );
}
