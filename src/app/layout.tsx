import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}