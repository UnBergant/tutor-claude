import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export function VocabularyEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-4xl mb-4">📚</p>
        <h3 className="text-lg font-semibold mb-2">No words yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Complete lessons to automatically build your personal vocabulary. Each
          correct answer adds words to your collection.
        </p>
        <Link href="/lessons">
          <Button>Start a Lesson</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
