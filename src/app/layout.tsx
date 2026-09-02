import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const text = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "NexLearn — The AI tutor that teaches",
    template: "%s · NexLearn",
  },
  description:
    "NexLearn pairs every Grade 9–11 student with Nex — an embodied AI tutor that adapts every question in real time and picks up a whiteboard the moment you get stuck.",
};

export const viewport: Viewport = {
  themeColor: "#060b0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
