"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

interface BlockTransitionProps {
  blockScore: { correct: number; total: number };
  blockNumber: number;
  nextBlockTitle: string;
  nextBlockType: "REVIEW" | "NEW_MATERIAL";
  onContinue: () => void;
}

export function BlockTransition({
  blockScore,
  blockNumber,
  nextBlockTitle,
  nextBlockType,
  onContinue,
}: BlockTransitionProps) {
  const percentage =
    blockScore.total > 0
      ? Math.round((blockScore.correct / blockScore.total) * 100)
      : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="text-4xl">
              {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Block {blockNumber} Complete
              </h3>
              <p className="text-muted-foreground">
                Score: {blockScore.correct}/{blockScore.total} ({percentage}%)
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Up next:</p>
              <p className="font-medium">
                {nextBlockTitle}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({nextBlockType === "REVIEW" ? "Review" : "New Material"})
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onContinue} className="w-full" size="lg">
        Continue
      </Button>
    </div>
  );
}
