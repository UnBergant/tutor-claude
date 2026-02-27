import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/card";

interface DueReviewsBannerProps {
  count: number;
}

export function DueReviewsBanner({ count }: DueReviewsBannerProps) {
  if (count === 0) return null;

  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            <span className="font-medium">{count}</span> lesson
            {count !== 1 ? "s" : ""} ready for review
          </p>
          <Link
            href="/lessons"
            className="text-sm font-medium text-primary hover:underline"
          >
            Review now
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
