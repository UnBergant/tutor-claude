"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { generateNextLesson } from "../actions";

interface LessonInfo {
  id: string;
  title: string;
  order: number;
  status: string;
  score: number | null;
}

interface ModuleLessonListProps {
  moduleId: string;
  moduleTitle: string;
  moduleLevel: string;
  lessons: LessonInfo[];
  canGenerateMore: boolean;
}

export function ModuleLessonList({
  moduleId,
  moduleTitle,
  moduleLevel,
  lessons,
  canGenerateMore,
}: ModuleLessonListProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateNext() {
    setIsGenerating(true);
    try {
      const lesson = await generateNextLesson(moduleId);
      if (lesson) {
        router.push(`/lesson/${lesson.id}`);
      }
    } catch (err) {
      console.error("Failed to generate lesson:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✓";
      case "IN_PROGRESS":
        return "→";
      default:
        return "○";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 dark:text-green-400";
      case "IN_PROGRESS":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">{moduleTitle}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{moduleLevel}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-3">
                <span
                  className={`text-lg font-mono ${statusColor(lesson.status)}`}
                >
                  {statusIcon(lesson.status)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    Lesson {lesson.order}: {lesson.title}
                  </p>
                </div>
                {lesson.status === "COMPLETED" && lesson.score !== null && (
                  <Badge variant="secondary">
                    {Math.round(lesson.score * 100)}%
                  </Badge>
                )}
                {lesson.status === "IN_PROGRESS" && <Badge>Continue</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {canGenerateMore && (
        <Button
          variant="outline"
          onClick={handleGenerateNext}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating next lesson..." : "Generate Next Lesson"}
        </Button>
      )}

      <Link href="/modules">
        <Button variant="ghost" className="w-full">
          Switch Module
        </Button>
      </Link>
    </div>
  );
}
