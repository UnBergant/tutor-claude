import { describe, expect, it } from "vitest";
import { buildChatSystemPrompt } from "./chat";

describe("buildChatSystemPrompt", () => {
  it("includes base Celestia persona", () => {
    const prompt = buildChatSystemPrompt({ level: "A1" });
    expect(prompt).toContain("Celestia");
    expect(prompt).toContain("Castellano");
  });

  it("includes chat behavior instructions", () => {
    const prompt = buildChatSystemPrompt({ level: "B1" });
    expect(prompt).toContain("Chat Mode");
    expect(prompt).toContain("Inline Corrections");
    expect(prompt).toContain("correction:");
  });

  it("includes student level", () => {
    const prompt = buildChatSystemPrompt({ level: "B2" });
    expect(prompt).toContain("**B2**");
    expect(prompt).toContain("CEFR level");
  });

  it("includes situation context when provided", () => {
    const prompt = buildChatSystemPrompt({
      level: "A2",
      situationPrompt: "You are a waiter at a tapas restaurant in Madrid.",
    });
    expect(prompt).toContain("Situation Context");
    expect(prompt).toContain("tapas restaurant in Madrid");
  });

  it("omits situation section when not provided", () => {
    const prompt = buildChatSystemPrompt({ level: "A1" });
    expect(prompt).not.toContain("Situation Context");
  });

  it("includes Peninsular Spanish rules", () => {
    const prompt = buildChatSystemPrompt({ level: "A1" });
    expect(prompt).toContain("Vosotros");
    expect(prompt).toContain("Distinción");
    expect(prompt).toContain("Pretérito perfecto");
  });

  it("includes level adaptation guidelines", () => {
    const prompt = buildChatSystemPrompt({ level: "A1" });
    expect(prompt).toContain("A1–A2");
    expect(prompt).toContain("B1–B2");
    expect(prompt).toContain("C1–C2");
  });

  it("mentions correction format", () => {
    const prompt = buildChatSystemPrompt({ level: "B1" });
    expect(prompt).toContain("'what they wrote' → 'correct form'");
  });
});
