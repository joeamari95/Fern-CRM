"use client";

import { Card, SectionHeader } from "@/components/ui";

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight mb-5">Settings</h1>
      <Card>
        <SectionHeader title="Settings" sub="Placeholder" />
        <p className="text-[13px] text-[var(--muted)]">
          Settings will live here. The AI features (Sounding Board and Email Review) read the
          Anthropic API key from the <code>REACT_APP_ANTHROPIC_KEY</code> environment variable on the
          server.
        </p>
      </Card>
    </>
  );
}
