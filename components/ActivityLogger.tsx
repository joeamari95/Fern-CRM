"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logActivity } from "@/lib/time";

// Passive: records which app section was opened, into finn:activity:<date>.
// Used by the billable-hours audit log. Does not alter any other feature.
function sectionLabel(path: string): string {
  const s = path.split("/").filter(Boolean);
  if (s[0] === "cases" && s[1]) {
    const map: Record<string, string> = {
      overview: "Case Overview",
      deadlines: "Deadlines",
      discovery: "Discovery",
      contacts: "Parties & Contacts",
      correspondence: "Correspondence",
      court: "Court Tracking",
      reports: "Reports",
    };
    return map[s[2] || ""] || "Case Dashboard";
  }
  const top: Record<string, string> = {
    "": "Associate Dashboard",
    cases: "Case List",
    "time-entry": "Billable Hours",
    "email-review": "Email Review",
    settings: "Settings",
  };
  return top[s[0] || ""] || path;
}

export default function ActivityLogger() {
  const pathname = usePathname();
  const last = useRef<string>("");
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    logActivity("nav", `Opened ${sectionLabel(pathname)}`);
  }, [pathname]);
  return null;
}
