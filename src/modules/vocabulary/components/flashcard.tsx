"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import type { VocabularyWordItem } from "../types";

interface FlashcardProps {
  word: VocabularyWordItem;
  onKnow: () => void;
  onDontKnow: () => void;
  disabled?: boolean;
}

export function Flashcard({
  word,
  onKnow,
  onDontKnow,
  disabled,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card container with 3D perspective */}
      <button
        type="button"
        className="relative h-56 w-full cursor-pointer [perspective:1000px] bg-transparent border-none p-0 text-left"
        onClick={() => setIsFlipped((f) => !f)}
        aria-label={
          isFlipped
            ? "Showing answer, click to flip back"
            : "Click to reveal answer"
        }
      >
        <div
          className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center p-6">
            <p className="text-2xl font-bold text-center">{word.word}</p>
            <p className="text-sm text-muted-foreground mt-3">Tap to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center p-6">
            <p className="text-lg font-medium text-center">
              {word.translation || "No translation"}
            </p>
            {word.context && (
              <p className="text-sm text-muted-foreground text-center mt-2 italic">
                {word.context}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Action buttons — only show when flipped */}
      {isFlipped && (
        <div className="flex gap-3 mt-4 animate-fade-in">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onDontKnow();
              setIsFlipped(false);
            }}
            disabled={disabled}
          >
            Don&apos;t Know
          </Button>
          <Button
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onKnow();
              setIsFlipped(false);
            }}
            disabled={disabled}
          >
            Know
          </Button>
        </div>
      )}
    </div>
  );
}
