"use server";

import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export async function saveUserTimezone(timezone: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.userProfile.updateMany({
    where: { userId: session.user.id },
    data: { timezone },
  });
}
