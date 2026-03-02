import Link from "next/link";
import { redirect } from "next/navigation";
import { ContinueLearningCard } from "@/modules/lesson/components/continue-learning-card";
import { ModuleSummaryCard } from "@/modules/lesson/components/module-summary-card";
import { getActiveModuleId, getUserModules } from "@/modules/lesson/queries";
import { auth } from "@/shared/lib/auth";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export default async function LessonsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [allModules, activeModuleId] = await Promise.all([
    getUserModules(userId),
    getActiveModuleId(userId),
  ]);

  if (allModules.length === 0) {
    redirect("/modules");
  }

  // Classify each module
  const activeModule = activeModuleId
    ? allModules.find((m) => m.id === activeModuleId)
    : null;

  // In Progress = non-active modules that have lessons AND not all completed
  const inProgressModules = allModules.filter((m) => {
    if (m.id === activeModuleId) return false;
    if (m.lessons.length === 0) return false;
    return m.lessons.some((l) => l.progress[0]?.status !== "COMPLETED");
  });

  // Completed lessons — flat list across all modules
  const completedLessons = allModules.flatMap((m) =>
    m.lessons
      .filter((l) => l.progress[0]?.status === "COMPLETED")
      .map((l) => ({
        id: l.id,
        title: l.title,
        score: l.progress[0]?.score ?? null,
      })),
  );

  // Find the current lesson in the active module (first non-completed)
  const currentLesson = activeModule
    ? (() => {
        for (const l of activeModule.lessons) {
          const status = l.progress[0]?.status ?? "NOT_STARTED";
          if (status !== "COMPLETED") {
            return { id: l.id, title: l.title, order: l.order, status };
          }
        }
        return null;
      })()
    : null;

  const allActiveCompleted =
    !!activeModule &&
    activeModule.lessons.length > 0 &&
    activeModule.lessons.every((l) => l.progress[0]?.status === "COMPLETED");

  const canGenerateMore =
    allActiveCompleted && activeModule!.lessons.length < 4;

  return (
    <div className="space-y-8 stagger-fade-in">
      {/* Continue Learning — hero */}
      {activeModule ? (
        <section>
          <h2 className="text-lg font-semibold mb-3">New Topic</h2>
          <ContinueLearningCard
            moduleId={activeModule.id}
            moduleTitle={activeModule.title}
            moduleLevel={activeModule.level}
            currentLesson={currentLesson}
            canGenerateMore={canGenerateMore}
          />
        </section>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg font-medium">No active module</p>
          <p className="mt-1">Pick a module below or explore new topics.</p>
        </div>
      )}

      {/* In Progress — other started modules */}
      {inProgressModules.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">In Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inProgressModules.map((m) => {
              const completed = m.lessons.filter(
                (l) => l.progress[0]?.status === "COMPLETED",
              ).length;
              return (
                <ModuleSummaryCard
                  key={m.id}
                  moduleId={m.id}
                  title={m.title}
                  level={m.level}
                  completedCount={completed}
                  totalCount={m.lessons.length}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Completed — flat list */}
      {completedLessons.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">Completed</h3>
          <div className="space-y-2">
            {completedLessons.map((l) => (
              <Link key={l.id} href={`/lesson/${l.id}`}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                  <span className="text-green-600 dark:text-green-400 font-mono">
                    ✓
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {l.title}
                  </span>
                  {l.score !== null && (
                    <Badge variant="secondary">
                      {Math.round(l.score * 100)}%
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link href="/modules">
        <Button variant="ghost" className="w-full">
          Explore New Topics
        </Button>
      </Link>
    </div>
  );
}
