"use client";

import { useAssessmentStore } from "@/modules/assessment/store";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export function WelcomeStep() {
  const setStep = useAssessmentStore((s) => s.setStep);

  return (
    <Card className="w-full max-w-lg mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Celestia</CardTitle>
        <CardDescription className="text-base">
          Your personal AI Spanish tutor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Let&apos;s find out your current Spanish level so we can create a
          personalized learning program just for you. This quick assessment
          takes about 3 minutes.
        </p>
        <Button
          size="lg"
          onClick={() => setStep("experience")}
          className="w-full sm:w-auto"
        >
          Let&apos;s begin
        </Button>
      </CardContent>
    </Card>
  );
}
