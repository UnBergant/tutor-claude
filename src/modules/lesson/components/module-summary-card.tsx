"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { activateModule } from "../actions";

interface ModuleSummaryCardProps {
  moduleId: string;
  title: string;
  level: string;
  completedCount: number;
  totalCount: number;
}

export function ModuleSummaryCard({
  moduleId,
  title,
  level,
  completedCount,
  totalCount,
}: ModuleSummaryCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    startTransition(async () => {
      try {
        await activateModule(moduleId);
        router.refresh();
      } catch {
        toast.error("Failed to switch module. Please try again.");
      }
    });
  }

  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">{level}</Badge>
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} lessons completed
        </p>
        <Progress value={progressPercent} className="mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={handleActivate}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          {isPending ? "Switching..." : "Continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
