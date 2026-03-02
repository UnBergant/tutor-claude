"use client";

import { useAssessmentStore } from "@/modules/assessment/store";
import { cn } from "@/shared/lib/utils";
import type { ExperienceLevel } from "@/shared/types/assessment";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "complete_beginner",
    label: "Complete beginner",
    description: "I've never studied Spanish before",
  },
  {
    value: "know_basics",
    label: "Know some basics",
    description: "I can say greetings and simple sentences",
  },
  {
    value: "simple_conversations",
    label: "Simple conversations",
    description: "I can have basic conversations about everyday topics",
  },
  {
    value: "comfortable_most_topics",
    label: "Comfortable with most topics",
    description: "I can discuss a wide range of topics",
  },
  {
    value: "advanced_near_fluent",
    label: "Advanced / near-fluent",
    description: "I speak fluently with occasional mistakes",
  },
  {
    value: "near_native",
    label: "Near-native",
    description: "I've studied formally for years or lived in Spain",
  },
];

export function ExperienceStep() {
  const { experienceLevel, setExperienceLevel, setStep } = useAssessmentStore();

  function handleSelect(value: ExperienceLevel) {
    setExperienceLevel(value);
  }

  function handleNext() {
    if (experienceLevel) {
      setStep("goal");
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">
          How would you describe your Spanish?
        </CardTitle>
        <CardDescription>
          This helps us calibrate the assessment to your level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {EXPERIENCE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "h-auto min-h-14 px-4 py-3 text-left justify-start whitespace-normal",
                experienceLevel === option.value &&
                  "border-primary bg-primary/10 ring-1 ring-primary",
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
          disabled={!experienceLevel}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
