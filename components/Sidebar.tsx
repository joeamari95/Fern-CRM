"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readCollection } from "@/lib/store/local";
import type { Case } from "@/lib/types";

const GLOBAL_NAV = [
  { href: "/", label: "Associate Dashboard", icon: "◆" },
  { href: "/cases", label: "Case List", icon: "▦" },
  { href: "/email-review", label: "Email Review", icon: "✉" },
  { href: "/time-entry", label: "Billable Hours", icon: "◴" },
];

function caseNav(id: string) {
  const base = `/cases/${id}`;
  return [
    { href: base, label: "Dashboard", icon: "◆", exact: true },
    { href: `${base}/overview`, label: "Case Overview", icon: "▸" },
    { href: `${base}/deadlines`, label: "Deadlines", icon: "◷" },
    { href: `${base}/discovery`, label: "Discovery", icon: "⇄" },
    { href: `${base}/contacts`, label: "Parties & Contacts", icon: "◎" },
    { href: `${base}/correspondence`, label: "Correspondence", icon: "✉" },
    { href: `${base}/court`, label: "Court Tracking", icon: "§" },
    { href: `${base}/reports`, label: "Reports", icon: "❏" },
  ];
}

export default function Sidebar() {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);
  const inCase = segs[0] === "cases" && segs.length >= 2;
  const caseId = inCase ? segs[1] : null;

  const [caseName, setCaseName] = useState<string>("");
  useEffect(() => {
    if (!caseId) return;
    const found = readCollection<Case>("cases").find((c) => c.id === caseId);
    setCaseName(found?.name ?? "");
  }, [caseId, pathname]);

  return (
    <aside className="w-[252px] shrink-0 h-screen sticky top-0 hidden md:flex flex-col border-r hairline px-3 py-5 overflow-y-auto">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-6">
        <span
          className="grid place-items-center w-8 h-8 rounded-xl text-bg font-bold text-sm"
          style={{ background: "linear-gradient(145deg, var(--teal), var(--blue))" }}
        >
          F
        </span>
        <div className="leading-tight">
          <div className="font-semibold text-[15px]">Finn</div>
          <div className="text-[11px] text-[var(--faint)]">Case Management</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {GLOBAL_NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className="nav-link" data-active={active}>
              <span className="w-4 text-center text-[var(--faint)]">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      {caseId && (
        <>
          <div className="mt-5 mb-2 px-2">
            <Link href="/cases" className="text-[11px] text-[var(--blue)] hover:underline">
              ← Back to Case List
            </Link>
            {caseName && (
              <div className="text-[12px] font-medium mt-2 leading-snug text-[var(--muted)]">
                {caseName}
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1">
            {caseNav(caseId).map((n) => {
              const active = n.exact ? pathname === n.href : pathname === n.href;
              return (
                <Link key={n.href} href={n.href} className="nav-link" data-active={active}>
                  <span className="w-4 text-center text-[var(--faint)]">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <div className="mt-auto pt-4">
        <Link href="/settings" className="nav-link" data-active={pathname === "/settings"}>
          <span className="w-4 text-center text-[var(--faint)]">⚙</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}
