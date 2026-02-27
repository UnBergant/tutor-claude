import { redirect } from "next/navigation";
import { ModuleLessonList } from "@/modules/lesson/components/module-lesson-list";
import { getActiveModuleWithProgress } from "@/modules/lesson/queries";
import { auth } from "@/shared/lib/auth";

export default async function LessonsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeModule = await getActiveModuleWithProgress(session.user.id);

  if (!activeModule) {
    redirect("/modules");
  }

  const lessons = activeModule.lessons.map((l) => ({
    id: l.id,
    title: l.title,
    order: l.order,
    status: l.progress[0]?.status ?? "NOT_STARTED",
    score: l.progress[0]?.score ?? null,
  }));

  const allCompleted = lessons.every((l) => l.status === "COMPLETED");
  const canGenerateMore = allCompleted && lessons.length < 4;

  return (
    <ModuleLessonList
      moduleId={activeModule.id}
      moduleTitle={activeModule.title}
      moduleLevel={activeModule.level}
      lessons={lessons}
      canGenerateMore={canGenerateMore}
    />
  );
}
