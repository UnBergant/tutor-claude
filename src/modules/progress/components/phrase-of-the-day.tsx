import type { SpanishPhrase } from "@/shared/data/phrases";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface PhraseOfTheDayProps {
  phrase: SpanishPhrase;
}

export function PhraseOfTheDay({ phrase }: PhraseOfTheDayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Phrase of the Day</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{phrase.phrase}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {phrase.translation}
        </p>
        {phrase.literal && (
          <p className="text-xs text-muted-foreground/70 mt-1 italic">
            Literal: {phrase.literal}
          </p>
        )}
        {phrase.example && (
          <p className="text-sm mt-2 bg-muted/50 rounded-md px-3 py-2 italic">
            {phrase.example}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
