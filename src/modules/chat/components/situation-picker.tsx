"use client";

import { cn } from "@/shared/lib/utils";
import { SITUATIONS } from "../situations";

interface SituationPickerProps {
  onSelect: (situationId: string | null, starterMessage?: string) => void;
  level: string;
}

/** CEFR level order for comparison */
const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

function isLevelSufficient(studentLevel: string, minLevel: string): boolean {
  const studentIdx = LEVEL_ORDER.indexOf(studentLevel);
  const minIdx = LEVEL_ORDER.indexOf(minLevel);
  if (studentIdx === -1 || minIdx === -1) return true;
  return studentIdx >= minIdx;
}

/**
 * Scenario selection grid shown before a chat session starts.
 * Filters situations by student's CEFR level — shows all at or below their level.
 */
export function SituationPicker({ onSelect, level }: SituationPickerProps) {
  const handleSelect = (situationId: string, starterMessage: string) => {
    onSelect(situationId, starterMessage);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Chat with Celestia
          </h1>
          <p className="text-muted-foreground mt-1">
            Choose a conversation scenario to practice your Spanish
          </p>
        </div>

        <div className="stagger-fade-in grid gap-3 sm:grid-cols-2">
          {SITUATIONS.map((situation) => {
            const available = isLevelSufficient(level, situation.minLevel);
            return (
              <button
                key={situation.id}
                type="button"
                onClick={() =>
                  handleSelect(situation.id, situation.starterMessage)
                }
                disabled={!available}
                className={cn(
                  "group border bg-card rounded-xl p-4 text-left transition-all",
                  available
                    ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-2xl"
                    role="img"
                    aria-label={situation.title}
                  >
                    {situation.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {situation.title}
                      </h3>
                      {situation.minLevel !== "A1" && (
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                          {situation.minLevel}+
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {situation.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
