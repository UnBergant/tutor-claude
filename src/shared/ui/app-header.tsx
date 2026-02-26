"use client";

import { LogOutIcon, MenuIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useSidebar } from "@/shared/hooks/use-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export function AppHeader() {
  const { toggle } = useSidebar();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggle}
        aria-label="Toggle sidebar"
      >
        <MenuIcon className="size-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Avatar size="sm">
          {user?.image && (
            <AvatarImage src={user.image} alt={user.name ?? ""} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ redirectTo: "/login" })}
          aria-label="Sign out"
        >
          <LogOutIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
