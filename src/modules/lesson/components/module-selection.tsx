"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  type ModuleProposal,
  regenerateModuleProposals,
  selectModule,
} from "../actions";
import { ModuleCard } from "./module-card";

interface ModuleSelectionProps {
  modules: ModuleProposal[];
}

export function ModuleSelection({
  modules: initialModules,
}: ModuleSelectionProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [isRegenerating, startRegenerate] = useTransition();

  async function handleSelect(moduleId: string) {
    setSelectingId(moduleId);
    try {
      const lesson = await selectModule(moduleId);
      router.push(`/lesson/${lesson.id}`);
    } catch (err) {
      setSelectingId(null);
      toast.error("Failed to start module. Please try again.");
      console.error("Failed to select module:", err);
    }
  }

  function handleRegenerate() {
    startRegenerate(async () => {
      try {
        const newModules = await regenerateModuleProposals();
        setModules(newModules);
      } catch (err) {
        toast.error("Failed to generate new suggestions. Please try again.");
        console.error("Failed to regenerate modules:", err);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">
          Choose Your Module
        </h1>
        <p className="text-muted-foreground">
          Based on your assessment, Celestia recommends these grammar modules.
          Pick one to start learning.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 stagger-fade-in">
        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            onSelect={handleSelect}
            isSelecting={selectingId === m.id}
          />
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating || selectingId !== null}
        >
          {isRegenerating
            ? "Generating new suggestions..."
            : "I want something else"}
        </Button>
      </div>
    </div>
  );
}
