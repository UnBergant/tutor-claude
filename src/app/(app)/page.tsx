import Link from "next/link";
import { redirect } from "next/navigation";
import { getDueReviews, getNextLessonForUser } from "@/modules/lesson/queries";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type {
  AssessmentResult,
  TopicAssessment,
} from "@/shared/types/assessment";
import type { CEFRLevel } from "@/shared/types/grammar";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Check if user has completed an assessment
  const completedAssessment = await prisma.assessment.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  if (!completedAssessment) {
    redirect("/onboarding");
  }

  // Parallel data fetch
  const [nextLesson, dueReviews, profile] = await Promise.all([
    getNextLessonForUser(userId),
    getDueReviews(userId),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { currentLevel: true, lessonsCompleted: true, totalXp: true },
    }),
  ]);

  // Extract gap map for progress display
  const meta = completedAssessment.metadata as unknown as {
    result?: AssessmentResult;
  };
  const gapMap = meta?.result?.gapMap ?? [];
  const progressByLevel = computeLevelProgress(gapMap);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Your current level: {profile?.currentLevel ?? "A1"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Start Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            {nextLesson ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {nextLesson.status === "IN_PROGRESS"
                    ? "Continue where you left off:"
                    : "Next up:"}
                </p>
                <p className="font-medium">
                  {nextLesson.moduleTitle} — Lesson {nextLesson.order}
                </p>
                <p className="text-sm">{nextLesson.title}</p>
                <Link href={`/lesson/${nextLesson.lessonId}`}>
                  <Button className="w-full">
                    {nextLesson.status === "IN_PROGRESS"
                      ? "Continue Lesson"
                      : "Start Lesson"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No active lesson. Choose a module to start learning.
                </p>
                <Link href="/modules">
                  <Button className="w-full">Explore Modules</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Topics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Discover new grammar modules based on your assessment results.
            </p>
            <Link href="/modules">
              <Button variant="outline" className="w-full">
                Explore Modules
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Review Due Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Due</CardTitle>
          </CardHeader>
          <CardContent>
            {dueReviews.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {dueReviews.length} lesson{dueReviews.length > 1 ? "s" : ""}{" "}
                  ready for review
                </p>
                <div className="space-y-1">
                  {dueReviews.slice(0, 3).map((r) => (
                    <Link
                      key={r.id}
                      href={`/lesson/${r.lesson.id}`}
                      className="block text-sm hover:underline"
                    >
                      {r.lesson.module.title}: {r.lesson.title}
                    </Link>
                  ))}
                  {dueReviews.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{dueReviews.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reviews due. Complete lessons to schedule spaced reviews.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {profile?.lessonsCompleted ?? 0} lessons completed
              </p>
              <div className="space-y-2">
                {progressByLevel.map(({ level, mastered, total }) => {
                  const pct =
                    total > 0 ? Math.round((mastered / total) * 100) : 0;
                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{level}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function computeLevelProgress(
  gapMap: TopicAssessment[],
): { level: CEFRLevel; mastered: number; total: number }[] {
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const map: Record<string, { mastered: number; total: number }> = {};

  for (const level of levels) {
    map[level] = { mastered: 0, total: 0 };
  }

  for (const item of gapMap) {
    const m = map[item.level];
    if (m) {
      m.total++;
      if (item.status === "mastered") m.mastered++;
    }
  }

  return levels.map((level) => ({
    level,
    mastered: map[level].mastered,
    total: map[level].total,
  }));
}
