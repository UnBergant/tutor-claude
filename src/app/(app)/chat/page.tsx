import { redirect } from "next/navigation";
import { ChatContainer } from "@/modules/chat/components/chat-container";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLevel: true },
  });

  return <ChatContainer level={profile?.currentLevel ?? "A1"} />;
}
