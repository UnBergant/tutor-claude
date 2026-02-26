import { prisma } from "@/shared/lib/prisma";

interface RecordUsageParams {
  model: string;
  tokensInput: number;
  tokensOutput: number;
  endpoint: string;
}

interface LimitCheckResult {
  allowed: boolean;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

interface AiSettingsResult {
  model: string;
  dailyLimit: number;
  monthlyLimit: number;
}

const DEFAULT_SETTINGS: Record<string, AiSettingsResult> = {
  assessment: {
    model: "claude-sonnet-4-6",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  exercise: {
    model: "claude-haiku-4-5-20251001",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  chat: {
    model: "claude-sonnet-4-6",
    dailyLimit: 1_000_000,
    monthlyLimit: 20_000_000,
  },
  lesson: {
    model: "claude-sonnet-4-6",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  evaluation: {
    model: "claude-haiku-4-5-20251001",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
};

const FALLBACK: AiSettingsResult = {
  model: "claude-haiku-4-5-20251001",
  dailyLimit: 500_000,
  monthlyLimit: 10_000_000,
};

export async function recordAiUsage(userId: string, params: RecordUsageParams) {
  await prisma.aiUsage.create({
    data: {
      userId,
      model: params.model,
      tokensInput: params.tokensInput,
      tokensOutput: params.tokensOutput,
      endpoint: params.endpoint,
    },
  });
}

export async function checkAiLimit(userId: string): Promise<LimitCheckResult> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyAgg, monthlyAgg, userLimits, globalSettings] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { userId, createdAt: { gte: startOfDay } },
      _sum: { tokensInput: true, tokensOutput: true },
    }),
    prisma.aiUsage.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { tokensInput: true, tokensOutput: true },
    }),
    prisma.aiLimits.findUnique({ where: { userId } }),
    prisma.aiSettings.findMany(),
  ]);

  const dailyUsed =
    (dailyAgg._sum.tokensInput ?? 0) + (dailyAgg._sum.tokensOutput ?? 0);
  const monthlyUsed =
    (monthlyAgg._sum.tokensInput ?? 0) + (monthlyAgg._sum.tokensOutput ?? 0);

  // User-specific limits take priority, then sum of all global endpoint limits
  let dailyLimit: number;
  let monthlyLimit: number;

  if (userLimits) {
    dailyLimit = userLimits.dailyLimit;
    monthlyLimit = userLimits.monthlyLimit;
  } else if (globalSettings.length > 0) {
    dailyLimit = globalSettings.reduce((sum, s) => sum + s.dailyLimit, 0);
    monthlyLimit = globalSettings.reduce((sum, s) => sum + s.monthlyLimit, 0);
  } else {
    dailyLimit = Object.values(DEFAULT_SETTINGS).reduce(
      (sum, s) => sum + s.dailyLimit,
      0,
    );
    monthlyLimit = Object.values(DEFAULT_SETTINGS).reduce(
      (sum, s) => sum + s.monthlyLimit,
      0,
    );
  }

  return {
    allowed: dailyUsed < dailyLimit && monthlyUsed < monthlyLimit,
    dailyUsed,
    dailyLimit,
    monthlyUsed,
    monthlyLimit,
  };
}

export async function getAiSettings(
  endpoint: string,
): Promise<AiSettingsResult> {
  const settings = await prisma.aiSettings.findUnique({
    where: { endpoint },
  });

  if (settings) {
    return {
      model: settings.model,
      dailyLimit: settings.dailyLimit,
      monthlyLimit: settings.monthlyLimit,
    };
  }

  return DEFAULT_SETTINGS[endpoint] ?? FALLBACK;
}
