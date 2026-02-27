import { Card, CardContent } from "@/shared/ui/card";

interface StatsCardsProps {
  lessonsCompleted: number;
  accuracyPercentage: number;
  accuracyTotal: number;
  currentLevel: string;
  currentStreak: number;
  longestStreak: number;
}

export function StatsCards({
  lessonsCompleted,
  accuracyPercentage,
  accuracyTotal,
  currentLevel,
  currentStreak,
  longestStreak,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
      <StatCard value={lessonsCompleted.toString()} label="Lessons Completed" />
      <StatCard
        value={accuracyTotal > 0 ? `${accuracyPercentage}%` : "\u2014"}
        label="Overall Accuracy"
      />
      <StatCard value={currentLevel} label="Current Level" />
      <StatCard
        value={`${currentStreak} day${currentStreak !== 1 ? "s" : ""}`}
        label="Streak"
        sublabel={longestStreak > 0 ? `Best: ${longestStreak} days` : undefined}
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-0">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
