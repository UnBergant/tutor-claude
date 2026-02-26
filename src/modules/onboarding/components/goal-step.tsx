"use client";

import { useAssessmentStore } from "@/modules/assessment/store";
import { cn } from "@/shared/lib/utils";
import type { LearningGoal } from "@/shared/types/assessment";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const GOAL_OPTIONS: {
  value: LearningGoal;
  label: string;
  description: string;
}[] = [
  {
    value: "travel",
    label: "Travel",
    description: "I want to communicate while traveling in Spain",
  },
  {
    value: "relocation",
    label: "Living in Spain",
    description: "I'm moving to or already live in Spain",
  },
  {
    value: "work",
    label: "Work / Career",
    description: "I need Spanish for professional purposes",
  },
  {
    value: "academic",
    label: "Academic / Exams",
    description: "I'm preparing for DELE or studying formally",
  },
  {
    value: "culture",
    label: "Culture & Media",
    description: "I want to enjoy Spanish movies, books, and music",
  },
  {
    value: "personal",
    label: "Personal growth",
    description: "I'm learning for fun or personal enrichment",
  },
];

export function GoalStep() {
  const { learningGoal, setLearningGoal, setStep } = useAssessmentStore();

  function handleSelect(value: LearningGoal) {
    setLearningGoal(value);
  }

  function handleNext() {
    if (learningGoal) {
      setStep("assessment");
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">What&apos;s your main goal?</CardTitle>
        <CardDescription>
          This helps Celestia tailor your learning program
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {GOAL_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "h-auto min-h-14 px-4 py-3 text-left justify-start whitespace-normal",
                learningGoal === option.value &&
                  "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={!learningGoal}
          className="w-full"
        >
          Start assessment
        </Button>
      </CardContent>
    </Card>
  );
}
