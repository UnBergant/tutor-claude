import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const AI_SETTINGS_DEFAULTS = [
  {
    endpoint: "assessment",
    model: "claude-haiku-4-5-20251001",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  {
    endpoint: "exercise",
    model: "claude-haiku-4-5-20251001",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  {
    endpoint: "chat",
    model: "claude-sonnet-4-6",
    dailyLimit: 1_000_000,
    monthlyLimit: 20_000_000,
  },
  {
    endpoint: "lesson",
    model: "claude-sonnet-4-6",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
  {
    endpoint: "evaluation",
    model: "claude-haiku-4-5-20251001",
    dailyLimit: 500_000,
    monthlyLimit: 10_000_000,
  },
];

async function main() {
  console.log("Seeding AI settings...");

  for (const settings of AI_SETTINGS_DEFAULTS) {
    await prisma.aiSettings.upsert({
      where: { endpoint: settings.endpoint },
      update: {
        model: settings.model,
        dailyLimit: settings.dailyLimit,
        monthlyLimit: settings.monthlyLimit,
      },
      create: settings,
    });
  }

  console.log(`Seeded ${AI_SETTINGS_DEFAULTS.length} AI settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
