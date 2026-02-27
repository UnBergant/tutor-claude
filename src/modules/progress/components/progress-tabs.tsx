"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface ProgressTabsProps {
  overviewContent: ReactNode;
  mistakesContent: ReactNode;
}

export function ProgressTabs({
  overviewContent,
  mistakesContent,
}: ProgressTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="space-y-4 mt-4 stagger-fade-in">{overviewContent}</div>
      </TabsContent>
      <TabsContent value="mistakes">
        <div className="mt-4 animate-fade-in-up">{mistakesContent}</div>
      </TabsContent>
    </Tabs>
  );
}
