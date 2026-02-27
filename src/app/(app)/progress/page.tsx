import { redirect } from "next/navigation";
import { getDueReviews, getLatestAssessment } from "@/modules/lesson/queries";
import { DueReviewsBanner } from "@/modules/progress/components/due-reviews-banner";
import { LevelProgress } from "@/modules/progress/components/level-progress";
import { MistakeJournal } from "@/modules/progress/components/mistake-journal";
import { ModuleProgressList } from "@/modules/progress/components/module-progress-list";
import { ProgressTabs } from "@/modules/progress/components/progress-tabs";
import { StatsCards } from "@/modules/progress/components/stats-cards";
import {
  getCategoryBreakdown,
  getMistakeJournalEntries,
  getModuleProgressStats,
  getOverallAccuracy,
} from "@/modules/progress/queries";
import { computeLevelProgress } from "@/shared/lib/assessment-utils";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type { AssessmentResult } from "@/shared/types/assessment";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [
    profile,
    accuracy,
    moduleStats,
    mistakeEntries,
    categoryBreakdown,
    dueReviews,
    assessment,
  ] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        currentLevel: true,
        lessonsCompleted: true,
        currentStreak: true,
        longestStreak: true,
      },
    }),
    getOverallAccuracy(userId),
    getModuleProgressStats(userId),
    getMistakeJournalEntries(userId),
    getCategoryBreakdown(userId),
    getDueReviews(userId),
    getLatestAssessment(userId),
  ]);

  // Compute level progress from assessment gap map
  const meta = assessment?.metadata as unknown as {
    result?: AssessmentResult;
  };
  const gapMap = meta?.result?.gapMap ?? [];
  const progressByLevel = computeLevelProgress(gapMap);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">
          Your learning statistics and mistake patterns.
        </p>
      </div>

      <ProgressTabs
        overviewContent={
          <>
            <StatsCards
              lessonsCompleted={profile?.lessonsCompleted ?? 0}
              accuracyPercentage={accuracy.percentage}
              accuracyTotal={accuracy.total}
              currentLevel={profile?.currentLevel ?? "A1"}
              currentStreak={profile?.currentStreak ?? 0}
              longestStreak={profile?.longestStreak ?? 0}
            />
            <ModuleProgressList modules={moduleStats} />
            <LevelProgress levels={progressByLevel} />
            <DueReviewsBanner count={dueReviews.length} />
          </>
        }
        mistakesContent={
          <MistakeJournal
            entries={mistakeEntries}
            categoryBreakdown={categoryBreakdown}
          />
        }
      />
    </div>
  );
}
