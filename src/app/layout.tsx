import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "LifeVault - Expiry & Warranty Tracker",
  description: "Simple, reliable tracker for medicines, groceries, warranties, and renewals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}