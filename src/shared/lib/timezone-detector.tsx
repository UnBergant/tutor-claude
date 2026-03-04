"use client";

import { useEffect } from "react";
import { saveUserTimezone } from "./user-actions";

export function TimezoneDetector() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = localStorage.getItem("celestia_tz");
    if (saved === tz) return;

    saveUserTimezone(tz)
      .then((updated) => {
        if (updated) localStorage.setItem("celestia_tz", tz);
      })
      .catch(() => {});
  }, []);
  return null;
}
