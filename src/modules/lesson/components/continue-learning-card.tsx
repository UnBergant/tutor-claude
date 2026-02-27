"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { generateNextLesson } from "../actions";

interface ContinueLearningCardProps {
  moduleId: string;
  moduleTitle: string;
  moduleLevel: string;
  /** Current lesson to continue — null means all lessons in module are done. */
  currentLesson: {
    id: string;
    title: string;
    order: number;
    status: string;
  } | null;
  canGenerateMore: boolean;
}

export function ContinueLearningCard({
  moduleId,
  moduleTitle,
  moduleLevel,
  currentLesson,
  canGenerateMore,
}: ContinueLearningCardProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateNext() {
    setIsGenerating(true);
    try {
      const lesson = await generateNextLesson(moduleId);
      if (lesson) {
        router.push(`/lesson/${lesson.id}`);
      }
    } catch {
      toast.error("Failed to generate lesson. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // All done state
  if (!currentLesson) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-6 text-center space-y-3">
          <p className="text-lg font-semibold">
            All lessons in {moduleTitle} completed!
          </p>
          <p className="text-sm text-muted-foreground">
            <Badge variant="outline">{moduleLevel}</Badge>
          </p>
          {canGenerateMore ? (
            <Button
              onClick={handleGenerateNext}
              disabled={isGenerating}
              className="mt-2"
            >
              {isGenerating
                ? "Generating next lesson..."
                : "Generate Next Lesson"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Module complete — explore new topics below.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Active lesson
  return (
    <Link href={`/lesson/${currentLesson.id}`}>
      <Card className="border-2 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
        <CardContent className="py-5 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{moduleLevel}</Badge>
            <span className="text-sm text-muted-foreground">{moduleTitle}</span>
          </div>
          <p className="text-lg font-semibold">
            Lesson {currentLesson.order}: {currentLesson.title}
          </p>
          <Button size="sm" className="mt-1">
            {currentLesson.status === "IN_PROGRESS" ? "Continue" : "Start"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
