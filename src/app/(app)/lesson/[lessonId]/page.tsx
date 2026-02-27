import { redirect } from "next/navigation";
import { getLessonDetail } from "@/modules/lesson/actions";
import { LessonFlow } from "@/modules/lesson/components/lesson-flow";
import { auth } from "@/shared/lib/auth";

interface LessonPageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { lessonId } = await params;
  const lesson = await getLessonDetail(lessonId);

  return <LessonFlow lesson={lesson} />;
}
