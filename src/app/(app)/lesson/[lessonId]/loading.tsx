import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default function LessonLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Block title */}
      <Skeleton className="h-7 w-48" />

      {/* Content area */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>

      {/* Action button */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}
