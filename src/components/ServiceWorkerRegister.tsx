"use client";

import { useEffect } from "react";

// Înregistrează service worker-ul (PWA instalabilă). Doar în producție ca să nu
// interfereze cu hot-reload-ul în dev.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline-first best effort */
    });
  }, []);
  return null;
}
