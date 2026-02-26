"use client";

import { AssessmentFlow } from "@/modules/assessment/components/assessment-flow";
import { AssessmentResults } from "@/modules/assessment/components/assessment-results";
import { useAssessmentStore } from "@/modules/assessment/store";
import { ExperienceStep } from "./experience-step";
import { GoalStep } from "./goal-step";
import { WelcomeStep } from "./welcome-step";

export function OnboardingFlow() {
  const step = useAssessmentStore((s) => s.step);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {step === "welcome" && <WelcomeStep />}
      {step === "experience" && <ExperienceStep />}
      {step === "goal" && <GoalStep />}
      {step === "assessment" && <AssessmentFlow />}
      {step === "results" && <AssessmentResults />}
    </div>
  );
}
