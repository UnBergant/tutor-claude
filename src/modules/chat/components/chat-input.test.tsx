import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server actions to avoid next-auth/next-server import in vitest
vi.mock("../actions", () => ({
  submitFlashcardAnswer: vi.fn(),
}));

import { ChatInput } from "./chat-input";

afterEach(cleanup);

const defaultProps = { onSend: vi.fn(), disabled: false };

function getTextarea() {
  return screen.getByPlaceholderText("Type in Spanish...");
}

function mockPointer(pointer: "fine" | "coarse") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(pointer: fine)" ? pointer === "fine" : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("ChatInput auto-focus", () => {
  beforeEach(() => {
    mockPointer("fine");
  });

  it("auto-focuses textarea on mount", () => {
    render(<ChatInput {...defaultProps} />);

    expect(getTextarea()).toHaveFocus();
  });

  it("re-focuses textarea when disabled transitions true → false (desktop)", () => {
    const { rerender } = render(
      <ChatInput {...defaultProps} disabled={true} />,
    );

    const textarea = getTextarea();
    textarea.blur();

    rerender(<ChatInput {...defaultProps} disabled={false} />);

    expect(getTextarea()).toHaveFocus();
  });

  it("does NOT re-focus on mobile (pointer: coarse)", () => {
    mockPointer("coarse");

    const { rerender } = render(
      <ChatInput {...defaultProps} disabled={true} />,
    );

    const textarea = getTextarea();
    textarea.blur();

    rerender(<ChatInput {...defaultProps} disabled={false} />);

    expect(getTextarea()).not.toHaveFocus();
  });

  it("does NOT focus when disabled stays false on re-render", () => {
    const { rerender } = render(
      <ChatInput {...defaultProps} disabled={false} />,
    );

    const textarea = getTextarea();
    textarea.blur();

    rerender(<ChatInput {...defaultProps} disabled={false} />);

    expect(getTextarea()).not.toHaveFocus();
  });

  it("does NOT focus when disabled transitions false → true", () => {
    const { rerender } = render(
      <ChatInput {...defaultProps} disabled={false} />,
    );

    const textarea = getTextarea();
    textarea.blur();

    rerender(<ChatInput {...defaultProps} disabled={true} />);

    expect(getTextarea()).not.toHaveFocus();
  });
});
