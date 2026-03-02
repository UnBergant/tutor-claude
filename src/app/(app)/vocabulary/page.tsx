import { redirect } from "next/navigation";
import { VocabularyEmptyState } from "@/modules/vocabulary/components/empty-state";
import { ReviewSession } from "@/modules/vocabulary/components/review-session";
import { VocabularyList } from "@/modules/vocabulary/components/vocabulary-list";
import { VocabularyStatsBar } from "@/modules/vocabulary/components/vocabulary-stats";
import {
  getReviewQueue,
  getVocabularyStats,
  getVocabularyWords,
} from "@/modules/vocabulary/queries";
import { auth } from "@/shared/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default async function VocabularyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [words, reviewQueue, stats] = await Promise.all([
    getVocabularyWords(userId),
    getReviewQueue(userId),
    getVocabularyStats(userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vocabulary</h1>
            <p className="text-muted-foreground">
              Track and review your Spanish vocabulary with spaced repetition.
            </p>
          </div>
          <VocabularyStatsBar stats={stats} />
        </div>
      </div>

      {stats.total === 0 ? (
        <VocabularyEmptyState />
      ) : (
        <div className="space-y-4">
          {reviewQueue.length > 0 && <ReviewSession words={reviewQueue} />}

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Words ({stats.total})</TabsTrigger>
              <TabsTrigger value="due">
                Due for Review ({stats.dueForReview})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <VocabularyList words={words} />
            </TabsContent>
            <TabsContent value="due">
              <VocabularyList words={reviewQueue} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
