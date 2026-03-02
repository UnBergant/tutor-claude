"use client";

import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

/**
 * Chat text input with send button.
 * - Enter to send, Shift+Enter for new line
 * - 1s cooldown after sending to prevent spam
 * - Auto-focuses on mount
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || cooldown) return;

    onSend(trimmed);
    setValue("");
    setCooldown(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    cooldownTimerRef.current = setTimeout(() => setCooldown(false), 1000);
  }, [value, disabled, cooldown, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const isDisabled = disabled || cooldown || !value.trim();

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type in Spanish..."
          disabled={disabled}
          maxLength={2000}
          rows={1}
          className="border-input bg-muted/50 placeholder:text-muted-foreground focus:ring-ring flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
