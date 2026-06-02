"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [afgewezen, setAfgewezen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Controleer iOS
    const iosApparaat = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(iosApparaat);

    // Controleer standalone modus
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Controleer eerder afgewezen (sessie)
    const eerderAfgewezen =
      sessionStorage.getItem("pwa-install-afgewezen") === "true";
    setAfgewezen(eerderAfgewezen);

    // Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installeerApp = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setAfgewezen(true);
  }, [deferredPrompt]);

  const sluitBanner = useCallback(() => {
    sessionStorage.setItem("pwa-install-afgewezen", "true");
    setAfgewezen(true);
  }, []);

  const toonAndroidBanner = !isStandalone && !afgewezen && !!deferredPrompt;
  const toonIosBanner = !isStandalone && !afgewezen && isIos && !deferredPrompt;

  return { toonAndroidBanner, toonIosBanner, installeerApp, sluitBanner };
}
