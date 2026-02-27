"use client";

import { Card, CardContent } from "@/shared/ui/card";

export function LessonSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                Generating your lesson...
              </h3>
              <p className="text-sm text-muted-foreground">
                Celestia is preparing explanations and exercises tailored to
                your level.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
