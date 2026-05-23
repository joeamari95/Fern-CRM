"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalObject } from "@/lib/store/local";
import type { CaseProfile } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◆" },
  { href: "/case", label: "Case Overview", icon: "▸" },
  { href: "/deadlines", label: "Deadlines", icon: "◷" },
  { href: "/discovery", label: "Discovery", icon: "⇄" },
  { href: "/contacts", label: "Parties & Contacts", icon: "◎" },
  { href: "/correspondence", label: "Correspondence", icon: "✉" },
  { href: "/court", label: "Court Tracking", icon: "§" },
  { href: "/reports", label: "Reports", icon: "❏" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { value: c, ready } = useLocalObject<CaseProfile>("case");

  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 hidden md:flex flex-col border-r hairline px-3 py-5">
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-6">
        <span
          className="grid place-items-center w-8 h-8 rounded-xl text-bg font-bold text-sm"
          style={{ background: "linear-gradient(145deg, var(--teal), var(--blue))" }}
        >
          F
        </span>
        <div className="leading-tight">
          <div className="font-semibold text-[15px]">Fern</div>
          <div className="text-[11px] text-[var(--faint)]">Case Management</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className="nav-link" data-active={active}>
              <span className="w-4 text-center text-[var(--faint)]">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto card-2 p-3">
        <div className="tag mb-2">Active Matter</div>
        {ready && c ? (
          <>
            <div className="text-[13px] font-medium leading-snug">
              {c.caption || "Untitled matter"}
            </div>
            {c.index && (
              <div className="text-[11px] text-[var(--faint)] mt-1">Index {c.index}</div>
            )}
          </>
        ) : (
          <div className="text-[12px] text-[var(--faint)] leading-snug">
            {ready ? "No matter set up yet" : "…"}
          </div>
        )}
      </div>
    </aside>
  );
}
