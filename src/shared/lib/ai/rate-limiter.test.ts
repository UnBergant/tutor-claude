import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma before importing the module under test
vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    aiUsage: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    aiLimits: {
      findUnique: vi.fn(),
    },
    aiSettings: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/shared/lib/prisma";
import { checkAiLimit, getAiSettings, recordAiUsage } from "./rate-limiter";

const mockPrisma = prisma as unknown as {
  aiUsage: {
    create: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  aiLimits: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  aiSettings: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordAiUsage", () => {
  it("creates a usage record", async () => {
    mockPrisma.aiUsage.create.mockResolvedValue({});

    await recordAiUsage("user-1", {
      model: "claude-haiku-4-5-20251001",
      tokensInput: 100,
      tokensOutput: 50,
      endpoint: "assessment",
    });

    expect(mockPrisma.aiUsage.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        model: "claude-haiku-4-5-20251001",
        tokensInput: 100,
        tokensOutput: 50,
        endpoint: "assessment",
      },
    });
  });
});

describe("checkAiLimit", () => {
  it("allows usage when under limits", async () => {
    mockPrisma.aiUsage.aggregate
      .mockResolvedValueOnce({
        _sum: { tokensInput: 100, tokensOutput: 50 },
      })
      .mockResolvedValueOnce({
        _sum: { tokensInput: 1000, tokensOutput: 500 },
      });
    mockPrisma.aiLimits.findUnique.mockResolvedValue({
      dailyLimit: 1_000_000,
      monthlyLimit: 10_000_000,
    });
    mockPrisma.aiSettings.findMany.mockResolvedValue([]);

    const result = await checkAiLimit("user-1");

    expect(result.allowed).toBe(true);
    expect(result.dailyUsed).toBe(150);
    expect(result.monthlyUsed).toBe(1500);
    expect(result.dailyLimit).toBe(1_000_000);
    expect(result.monthlyLimit).toBe(10_000_000);
  });

  it("denies usage when daily limit exceeded", async () => {
    mockPrisma.aiUsage.aggregate
      .mockResolvedValueOnce({
        _sum: { tokensInput: 600_000, tokensOutput: 500_000 },
      })
      .mockResolvedValueOnce({
        _sum: { tokensInput: 600_000, tokensOutput: 500_000 },
      });
    mockPrisma.aiLimits.findUnique.mockResolvedValue({
      dailyLimit: 1_000_000,
      monthlyLimit: 10_000_000,
    });
    mockPrisma.aiSettings.findMany.mockResolvedValue([]);

    const result = await checkAiLimit("user-1");

    expect(result.allowed).toBe(false);
    expect(result.dailyUsed).toBe(1_100_000);
  });

  it("denies usage when monthly limit exceeded", async () => {
    mockPrisma.aiUsage.aggregate
      .mockResolvedValueOnce({
        _sum: { tokensInput: 100, tokensOutput: 50 },
      })
      .mockResolvedValueOnce({
        _sum: { tokensInput: 6_000_000, tokensOutput: 5_000_000 },
      });
    mockPrisma.aiLimits.findUnique.mockResolvedValue({
      dailyLimit: 1_000_000,
      monthlyLimit: 10_000_000,
    });
    mockPrisma.aiSettings.findMany.mockResolvedValue([]);

    const result = await checkAiLimit("user-1");

    expect(result.allowed).toBe(false);
    expect(result.monthlyUsed).toBe(11_000_000);
  });

  it("falls back to global settings when no user limits", async () => {
    mockPrisma.aiUsage.aggregate
      .mockResolvedValueOnce({
        _sum: { tokensInput: 100, tokensOutput: 50 },
      })
      .mockResolvedValueOnce({
        _sum: { tokensInput: 1000, tokensOutput: 500 },
      });
    mockPrisma.aiLimits.findUnique.mockResolvedValue(null);
    mockPrisma.aiSettings.findMany.mockResolvedValue([
      { endpoint: "assessment", dailyLimit: 500_000, monthlyLimit: 10_000_000 },
      { endpoint: "chat", dailyLimit: 1_000_000, monthlyLimit: 20_000_000 },
    ]);

    const result = await checkAiLimit("user-1");

    expect(result.allowed).toBe(true);
    expect(result.dailyLimit).toBe(1_500_000);
    expect(result.monthlyLimit).toBe(30_000_000);
  });

  it("falls back to hardcoded defaults when DB is empty", async () => {
    mockPrisma.aiUsage.aggregate
      .mockResolvedValueOnce({
        _sum: { tokensInput: 0, tokensOutput: 0 },
      })
      .mockResolvedValueOnce({
        _sum: { tokensInput: 0, tokensOutput: 0 },
      });
    mockPrisma.aiLimits.findUnique.mockResolvedValue(null);
    mockPrisma.aiSettings.findMany.mockResolvedValue([]);

    const result = await checkAiLimit("user-1");

    expect(result.allowed).toBe(true);
    // 5 endpoints × 500k daily (except chat at 1M) = 3M
    expect(result.dailyLimit).toBe(3_000_000);
  });
});

describe("getAiSettings", () => {
  it("returns settings from DB when available", async () => {
    mockPrisma.aiSettings.findUnique.mockResolvedValue({
      endpoint: "chat",
      model: "claude-sonnet-4-6",
      dailyLimit: 2_000_000,
      monthlyLimit: 40_000_000,
    });

    const result = await getAiSettings("chat");

    expect(result.model).toBe("claude-sonnet-4-6");
    expect(result.dailyLimit).toBe(2_000_000);
  });

  it("returns hardcoded defaults for known endpoints when not in DB", async () => {
    mockPrisma.aiSettings.findUnique.mockResolvedValue(null);

    const result = await getAiSettings("assessment");

    expect(result.model).toBe("claude-sonnet-4-6");
    expect(result.dailyLimit).toBe(500_000);
  });

  it("returns fallback for unknown endpoints", async () => {
    mockPrisma.aiSettings.findUnique.mockResolvedValue(null);

    const result = await getAiSettings("unknown-endpoint");

    expect(result.model).toBe("claude-haiku-4-5-20251001");
    expect(result.dailyLimit).toBe(500_000);
    expect(result.monthlyLimit).toBe(10_000_000);
  });
});
