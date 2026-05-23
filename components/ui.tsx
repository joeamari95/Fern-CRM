import type { ReactNode } from "react";
import type { Accent } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {sub && <p className="text-[12px] text-[var(--faint)] mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Pill({ accent, children }: { accent: Accent; children: ReactNode }) {
  return <span className={`pill pill-${accent}`}>{children}</span>;
}

export function Dot({ accent }: { accent: Accent }) {
  return <span className={`dot dot-${accent}`} aria-hidden />;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-[13px] text-[var(--faint)] py-6 text-center">{children}</div>
  );
}
