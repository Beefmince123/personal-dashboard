import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Dashboard",
  description: "Daily workouts, water, habits, goals, and devotional tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-100 font-sans">{children}</body>
    </html>
  );
}
