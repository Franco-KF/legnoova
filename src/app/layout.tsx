import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Legnoova — AI-Powered Forex Chart Analysis",
    template: "%s | Legnoova",
  },
  description:
    "Turn your forex charts into AI-powered trading insights. Upload a chart and let Legnoova analyze market structure, price action and multiple trading strategies to help you identify potential setups.",
  keywords: [
    "forex",
    "ai analysis",
    "chart analysis",
    "trading",
    "trading signals",
    "price action",
    "forex charts",
  ],
  openGraph: {
    title: "Legnoova — AI-Powered Forex Chart Analysis",
    description:
      "Turn your forex charts into AI-powered trading insights.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legnoova — AI-Powered Forex Chart Analysis",
    description:
      "Turn your forex charts into AI-powered trading insights.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background dark">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
