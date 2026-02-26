"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import type { CEFRLevel } from "@/shared/types/grammar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { summarizeGapMap } from "../lib/gap-map";
import { useAssessmentStore } from "../store";

const LEVEL_LABELS: Record<CEFRLevel, string> = {
  A1: "Breakthrough",
  A2: "Waystage",
  B1: "Threshold",
  B2: "Vantage",
  C1: "Effective Proficiency",
  C2: "Mastery",
};

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  A2: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  B1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export function AssessmentResults() {
  const router = useRouter();
  const result = useAssessmentStore((s) => s.result);

  if (!result) return null;

  const summary = summarizeGapMap(result.gapMap);
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Level Badge */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Your Spanish Level</CardTitle>
          <CardDescription>Based on your assessment responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <span
              className={cn(
                "text-5xl font-bold px-6 py-3 rounded-xl",
                LEVEL_COLORS[result.estimatedLevel],
              )}
            >
              {result.estimatedLevel}
            </span>
            <span className="text-lg text-muted-foreground">
              {LEVEL_LABELS[result.estimatedLevel]}
            </span>
            <span className="text-sm text-muted-foreground">
              Confidence: {confidencePercent}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gap Map */}
      <Card>
        <CardHeader>
          <CardTitle>Grammar Map</CardTitle>
          <CardDescription>
            Your strengths and areas to work on across CEFR levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(summary) as CEFRLevel[]).map((level) => {
            const s = summary[level];
            if (s.total === 0) return null;

            return (
              <div key={level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{level}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.mastered}/{s.total} mastered
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.gapMap
                    .filter((t) => t.level === level)
                    .map((topic) => (
                      <Badge
                        key={topic.topicId}
                        variant="outline"
                        className={cn(
                          "text-xs",
                          topic.status === "mastered" &&
                            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
                          topic.status === "not_mastered" &&
                            "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
                          topic.status === "untested" &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {topic.topicId}
                      </Badge>
                    ))}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
              Mastered
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800" />
              Needs work
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-muted" />
              Not tested
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button size="lg" className="w-full" onClick={() => router.push("/")}>
        Start Learning
      </Button>
    </div>
  );
}
