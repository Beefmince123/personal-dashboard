import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Personal Dashboard",
  description: "Daily workouts, water, habits, a daily to-do list, and devotional tracker.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  other: {
    // Next's appleWebApp.capable only emits the newer, unprefixed
    // "mobile-web-app-capable" tag — Safari's home-screen install still
    // keys off this classic Apple-prefixed one, so it's added explicitly.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-100 font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
