import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { cn } from "@/shared/lib/utils";
import type {
  AssessmentResult,
  TopicAssessment,
} from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

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

export default async function AssessmentResultsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const assessment = await prisma.assessment.findFirst({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
    include: { answers: true },
  });

  if (!assessment) {
    redirect("/onboarding");
  }

  const meta = assessment.metadata as { result?: AssessmentResult } | null;
  const result = meta?.result;

  if (!result) {
    redirect("/onboarding");
  }

  const level = result.estimatedLevel as CEFRLevel;
  const confidencePercent = Math.round(result.confidence * 100);
  const gapMap = result.gapMap as TopicAssessment[];

  // Group by level
  const groupedByLevel = gapMap.reduce(
    (acc, topic) => {
      const l = topic.level as CEFRLevel;
      if (!acc[l]) acc[l] = [];
      acc[l].push(topic);
      return acc;
    },
    {} as Record<CEFRLevel, TopicAssessment[]>,
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Assessment Results
        </h1>
        <p className="text-muted-foreground">
          Completed on {assessment.completedAt?.toLocaleDateString()}
        </p>
      </div>

      {/* Level Badge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-4xl font-bold px-4 py-2 rounded-xl",
                LEVEL_COLORS[level],
              )}
            >
              {level}
            </span>
            <div>
              <p className="font-medium text-lg">{LEVEL_LABELS[level]}</p>
              <p className="text-sm text-muted-foreground">
                Confidence: {confidencePercent}% &middot;{" "}
                {assessment.questionsAsked} questions answered
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grammar Map */}
      <Card>
        <CardHeader>
          <CardTitle>Grammar Map</CardTitle>
          <CardDescription>
            Topics tested and inferred across all CEFR levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((lvl) => {
            const topics = groupedByLevel[lvl];
            if (!topics?.length) return null;

            const mastered = topics.filter(
              (t) => t.status === "mastered",
            ).length;

            return (
              <div key={lvl} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{lvl}</span>
                  <span className="text-xs text-muted-foreground">
                    {mastered}/{topics.length} mastered
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {topics.map((topic) => (
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
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Questions</dt>
              <dd className="font-medium">{assessment.questionsAsked}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Correct</dt>
              <dd className="font-medium">
                {assessment.answers.filter((a) => a.isCorrect).length}/
                {assessment.answers.length}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
