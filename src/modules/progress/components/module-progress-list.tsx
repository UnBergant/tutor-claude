import Link from "next/link";
import type { ModuleProgressStat } from "@/modules/progress/queries";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

interface ModuleProgressListProps {
  modules: ModuleProgressStat[];
}

export function ModuleProgressList({ modules }: ModuleProgressListProps) {
  const started = modules.filter((m) => m.completedLessons > 0);

  if (started.length === 0) {
    return (
      <Card>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            No modules yet. Start learning to track your progress.
          </p>
          <Link href="/modules">
            <Button variant="outline" size="sm">
              Explore Modules
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Module Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {started.map((mod) => {
          const pct =
            mod.totalLessons > 0
              ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
              : 0;

          return (
            <div key={mod.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {mod.title}
                  </span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {mod.level}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {mod.completedLessons}/{mod.totalLessons}
                  {mod.avgScore != null && ` \u00b7 ${mod.avgScore}%`}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
