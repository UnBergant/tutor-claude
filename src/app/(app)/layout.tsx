import { redirect } from "next/navigation";
import { SidebarProvider } from "@/shared/hooks/use-sidebar";
import { auth } from "@/shared/lib/auth";
import { AppHeader } from "@/shared/ui/app-header";
import { AppSidebar } from "@/shared/ui/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
