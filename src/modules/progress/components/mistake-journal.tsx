"use client";

import Link from "next/link";
import { useState } from "react";
import type { MistakeCategory } from "@/generated/prisma";
import type { MistakeJournalEntry } from "@/modules/progress/queries";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface MistakeJournalProps {
  entries: MistakeJournalEntry[];
  categoryBreakdown: Record<MistakeCategory, number>;
}

const CATEGORY_LABELS: Record<MistakeCategory, string> = {
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
  WORD_ORDER: "Word Order",
};

const CATEGORY_ORDER: MistakeCategory[] = [
  "GRAMMAR",
  "VOCABULARY",
  "WORD_ORDER",
];

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function MistakeJournal({
  entries,
  categoryBreakdown,
}: MistakeJournalProps) {
  const [openCategories, setOpenCategories] = useState<Set<MistakeCategory>>(
    () => {
      // Auto-open the first category that has entries
      const first = CATEGORY_ORDER.find((c) => categoryBreakdown[c] > 0);
      return first ? new Set([first]) : new Set();
    },
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            No mistakes recorded yet. Complete some exercises to see patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = new Map<MistakeCategory, MistakeJournalEntry[]>();
  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, []);
  }
  for (const entry of entries) {
    grouped.get(entry.category)?.push(entry);
  }

  function toggleCategory(cat: MistakeCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Category summary badges */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((cat) => {
          const count = categoryBreakdown[cat];
          if (count === 0) return null;
          return (
            <Badge key={cat} variant="secondary">
              {CATEGORY_LABELS[cat]}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Collapsible category groups */}
      {CATEGORY_ORDER.map((cat) => {
        const catEntries = grouped.get(cat);
        if (!catEntries || catEntries.length === 0) return null;

        const isOpen = openCategories.has(cat);
        const totalCount = categoryBreakdown[cat];

        return (
          <Card key={cat}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleCategory(cat)}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">
                  {isOpen ? "\u25BC" : "\u25B6"}
                </span>
                {CATEGORY_LABELS[cat]}
                <span className="text-muted-foreground font-normal">
                  ({catEntries.length} pattern
                  {catEntries.length !== 1 ? "s" : ""} &middot; {totalCount}{" "}
                  total)
                </span>
              </CardTitle>
            </CardHeader>

            {isOpen && (
              <CardContent className="space-y-2">
                {catEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs truncate">
                        {entry.pattern}
                      </p>
                      {entry.topicTitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.topicTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.practiceLessonId && (
                        <Link
                          href={`/lesson/${entry.practiceLessonId}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Practice
                        </Link>
                      )}
                      <Badge variant="outline" className="text-xs">
                        &times;{entry.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(entry.lastOccurred)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
