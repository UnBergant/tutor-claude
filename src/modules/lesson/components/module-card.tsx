"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { ModuleProposal } from "../actions";

interface ModuleCardProps {
  module: ModuleProposal;
  onSelect: (moduleId: string) => void;
  isSelecting: boolean;
}

export function ModuleCard({ module, onSelect, isSelecting }: ModuleCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">{module.level}</Badge>
        </div>
        <CardTitle className="text-base">{module.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{module.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={() => onSelect(module.id)}
          disabled={isSelecting}
          className="w-full"
        >
          {isSelecting ? "Starting..." : "Start"}
        </Button>
      </CardContent>
    </Card>
  );
}
