"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { deleteWord } from "../actions";
import type { VocabularyWordItem } from "../types";

interface VocabularyListProps {
  words: VocabularyWordItem[];
}

export function VocabularyList({ words }: VocabularyListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(wordId: string) {
    setDeletingId(wordId);
    startTransition(async () => {
      await deleteWord(wordId);
      setDeletingId(null);
    });
  }

  if (words.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No words in this category.
      </p>
    );
  }

  return (
    <div className="space-y-2 stagger-fade-in">
      {words.map((word) => (
        <Card key={word.id}>
          <CardContent className="flex items-center justify-between gap-4 pt-0 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{word.word}</span>
                <IntervalBadge interval={word.interval} />
              </div>
              {word.translation && (
                <p className="text-sm text-muted-foreground truncate">
                  {word.translation}
                </p>
              )}
              {word.context && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                  {word.context}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(word.id)}
              disabled={isPending && deletingId === word.id}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              {isPending && deletingId === word.id ? "..." : "Delete"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IntervalBadge({ interval }: { interval: number }) {
  if (interval >= 21) {
    return (
      <Badge variant="secondary" className="text-xs">
        Mastered
      </Badge>
    );
  }
  if (interval >= 6) {
    return (
      <Badge variant="secondary" className="text-xs">
        Learning
      </Badge>
    );
  }
  return null;
}
