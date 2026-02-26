import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Check if user has completed an assessment
  const completedAssessment = await prisma.assessment.findFirst({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
  });

  if (!completedAssessment) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Celestia. Your personalized Spanish learning journey starts
          here.
        </p>
      </div>
    </div>
  );
}
