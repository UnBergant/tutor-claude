import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default function LessonsLoading() {
  return (
    <div className="space-y-8">
      {/* Hero card */}
      <section>
        <Skeleton className="h-5 w-28 mb-3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      </section>

      {/* In Progress */}
      <section>
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Card key={i}>
              <CardContent className="py-4 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
