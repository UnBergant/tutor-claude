import { Badge } from "@/shared/ui/badge";
import type { VocabularyStats } from "../types";

interface VocabularyStatsBarProps {
  stats: VocabularyStats;
}

export function VocabularyStatsBar({ stats }: VocabularyStatsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">{stats.total} total</Badge>
      <Badge variant={stats.dueForReview > 0 ? "destructive" : "secondary"}>
        {stats.dueForReview} due
      </Badge>
      <Badge variant="secondary">{stats.mastered} mastered</Badge>
    </div>
  );
}
