import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NavaFlow - Developer's Operating System",
  description: "NavaFlow: The SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
  keywords: ["NavaFlow", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React", "Developer Tools", "Real-time Collaboration"],
  authors: [{ name: "NavaFlow Team" }],
  openGraph: {
    title: "NavaFlow - Developer's Operating System",
    description: "SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
    url: "https://navaflow.com",
    siteName: "NavaFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NavaFlow - Developer's Operating System",
    description: "SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
