"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface BlockExplanationProps {
  title: string;
  explanation: string;
  type: "REVIEW" | "NEW_MATERIAL";
  blockNumber: number;
  totalBlocks: number;
  exerciseCount: number;
  onStartExercises: () => void;
}

/**
 * Strip **bold** markers from GFM table rows.
 * Leaves bold intact in non-table prose.
 */
function cleanTableBold(md: string): string {
  return md.replace(/^(\|.+\|)$/gm, (line) =>
    line.replace(/\*\*([^*]+)\*\*/g, "$1"),
  );
}

export function BlockExplanation({
  title,
  explanation,
  type,
  blockNumber,
  totalBlocks,
  exerciseCount,
  onStartExercises,
}: BlockExplanationProps) {
  const cleaned = cleanTableBold(explanation);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Block {blockNumber} of {totalBlocks}
        </span>
        <Badge variant={type === "REVIEW" ? "secondary" : "default"}>
          {type === "REVIEW" ? "Review" : "New Material"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{cleaned}</Markdown>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onStartExercises} className="w-full" size="lg">
        Start Exercises ({exerciseCount})
      </Button>
    </div>
  );
}
