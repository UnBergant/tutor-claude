"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { reviewWord } from "../actions";
import type { VocabularyWordItem } from "../types";
import { Flashcard } from "./flashcard";

interface ReviewSessionProps {
  words: VocabularyWordItem[];
}

export function ReviewSession({ words }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [results, setResults] = useState<{ known: number; unknown: number }>({
    known: 0,
    unknown: 0,
  });
  const [isPending, startTransition] = useTransition();

  if (words.length === 0) return null;

  // Show start button
  if (!isActive) {
    return (
      <Button onClick={() => setIsActive(true)} className="w-full sm:w-auto">
        Start Review ({words.length} word{words.length !== 1 ? "s" : ""})
      </Button>
    );
  }

  // Review complete
  if (currentIndex >= words.length) {
    const total = results.known + results.unknown;
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-8 text-center animate-fade-in">
          <p className="text-4xl mb-4">
            {results.known === total ? "🎉" : "💪"}
          </p>
          <h3 className="text-lg font-semibold mb-2">Review Complete</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {results.known} / {total} words known
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setResults({ known: 0, unknown: 0 });
              setIsActive(false);
            }}
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  const word = words[currentIndex];
  const progress = `${currentIndex + 1} / ${words.length}`;

  function handleAnswer(know: boolean) {
    startTransition(async () => {
      try {
        await reviewWord(word.id, know);
      } catch {
        toast.error("Failed to save review. Please try again.");
        return;
      }
      setResults((r) => ({
        known: r.known + (know ? 1 : 0),
        unknown: r.unknown + (know ? 0 : 1),
      }));
      setCurrentIndex((i) => i + 1);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{progress}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsActive(false);
            setCurrentIndex(0);
            setResults({ known: 0, unknown: 0 });
          }}
        >
          End Review
        </Button>
      </div>
      <Flashcard
        key={word.id}
        word={word}
        onKnow={() => handleAnswer(true)}
        onDontKnow={() => handleAnswer(false)}
        disabled={isPending}
      />
    </div>
  );
}
