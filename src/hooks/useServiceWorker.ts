"use client";

import { useEffect, useState, useCallback } from "react";

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const [updateBeschikbaar, setUpdateBeschikbaar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      // Controleer bestaande waiting worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateBeschikbaar(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
            setUpdateBeschikbaar(true);
          }
        });
      });
    });

    // Luister naar controller change (na skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const pasUpdateToe = useCallback(() => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setUpdateBeschikbaar(false);
  }, [waitingWorker]);

  return { updateBeschikbaar, pasUpdateToe };
}
