import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import FloatingSoundingBoard from "@/components/FloatingSoundingBoard";
import StickyNotes from "@/components/StickyNotes";
import ActivityLogger from "@/components/ActivityLogger";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finn — Case Management",
  description: "Litigation case management for Finn O'Connell, Wilson Elser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0 px-5 md:px-8 py-6 max-w-[1180px]">{children}</main>
        </div>
        <FloatingSoundingBoard />
        <StickyNotes />
        <ActivityLogger />
      </body>
    </html>
  );
}
