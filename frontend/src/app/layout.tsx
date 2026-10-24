import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VoiceOrder AI — Kirana Spoken Grocery Desk",
  description:
    "Turns spoken grocery orders in Hindi, Hinglish or regional languages into verified, priced orders with live stock deduction.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VoiceOrder AI",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

import { RoleProvider } from "@/context/RoleContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body className="flex flex-col min-h-full overflow-x-hidden w-full max-w-full">
        <RoleProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8 overflow-x-hidden">
            {children}
          </main>
          <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
            VoiceOrder AI • Built for The Great Indian AI Internship Challenge by Gnani AI
          </footer>
          <BottomNav />
        </RoleProvider>
      </body>
    </html>
  );
}
