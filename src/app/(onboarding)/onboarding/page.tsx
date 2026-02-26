import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/modules/onboarding/components/onboarding-flow";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Check if user already completed an assessment
  const completedAssessment = await prisma.assessment.findFirst({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
  });

  if (completedAssessment) {
    redirect("/");
  }

  return <OnboardingFlow />;
}
