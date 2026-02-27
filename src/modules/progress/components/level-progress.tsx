import type { LevelProgress as LevelProgressData } from "@/shared/lib/assessment-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

interface LevelProgressProps {
  levels: LevelProgressData[];
}

export function LevelProgress({ levels }: LevelProgressProps) {
  const hasData = levels.some((l) => l.total > 0);
  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Level Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {levels.map(({ level, mastered, total }) => {
          if (total === 0) return null;
          const pct = Math.round((mastered / total) * 100);

          return (
            <div key={level} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{level}</span>
                <span className="text-muted-foreground">
                  {mastered}/{total} topics ({pct}%)
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
