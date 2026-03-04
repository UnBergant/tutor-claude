"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { TimezoneDetector } from "./timezone-detector";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TimezoneDetector />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
