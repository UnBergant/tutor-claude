"use server";

import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function saveUserTimezone(timezone: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (!timezone || !isValidTimezone(timezone)) return false;

  const result = await prisma.userProfile.updateMany({
    where: { userId: session.user.id },
    data: { timezone },
  });
  return result.count > 0;
}
