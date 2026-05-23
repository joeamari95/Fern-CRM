import { activeCase } from "@/lib/data/case";
import { TODAY } from "@/lib/format";

export default function Header({
  title,
  greeting,
}: {
  title: string;
  greeting?: boolean;
}) {
  const dateStr = TODAY.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <header className="mb-7">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[26px] font-semibold tracking-tight">
          {greeting ? "Good morning, Fern." : title}
        </h1>
        <span className="text-[13px] text-[var(--muted)]">{dateStr}</span>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap text-[12px]">
        <span className="tag">{activeCase.shortName}</span>
        <span className="text-[var(--faint)]">·</span>
        <span className="text-[var(--muted)]">{activeCase.court}, {activeCase.county}</span>
        <span className="text-[var(--faint)]">·</span>
        <span className="tag">Index {activeCase.index}</span>
        <span className="pill pill-blue">{activeCase.status}</span>
      </div>
    </header>
  );
}
