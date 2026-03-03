"use client";

import { useEffect } from "react";
import { saveUserTimezone } from "./user-actions";

export function TimezoneDetector() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Fire-and-forget — no need to block UI
    saveUserTimezone(tz).catch(() => {});
  }, []);
  return null;
}
