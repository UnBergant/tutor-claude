"use client";

import Markdown from "react-markdown";
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

export function BlockExplanation({
  title,
  explanation,
  type,
  blockNumber,
  totalBlocks,
  exerciseCount,
  onStartExercises,
}: BlockExplanationProps) {
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
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{explanation}</Markdown>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onStartExercises} className="w-full" size="lg">
        Start Exercises ({exerciseCount})
      </Button>
    </div>
  );
}
