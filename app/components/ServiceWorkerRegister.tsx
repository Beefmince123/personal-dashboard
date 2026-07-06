"use client";

import { useEffect } from "react";

// `metadata`/`viewport` exports require app/layout.tsx to stay a Server
// Component, so the service worker registration (which needs a browser-only
// useEffect) lives here instead, rendered as a client child of the layout.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);

  return null;
}
