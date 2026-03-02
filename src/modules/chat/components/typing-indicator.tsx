"use client";

/** Animated dots shown while Celestia is "typing" (streaming) */
export function TypingIndicator() {
  return (
    <output
      className="flex items-center gap-1 px-4 py-3"
      aria-label="Celestia is typing"
    >
      <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/40 size-2 animate-bounce rounded-full [animation-delay:300ms]" />
    </output>
  );
}
