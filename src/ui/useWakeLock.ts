import { useEffect, useState } from "react";

export function useWakeLock() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const supported = "wakeLock" in navigator;
  useEffect(() => {
    if (!enabled || !supported) return;
    let disposed = false;
    let sentinel: WakeLockSentinel | undefined;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          await lock.release();
          return;
        }
        sentinel = lock;
        setActive(true);
        setMessage("");
        lock.addEventListener("release", () => setActive(false));
      } catch {
        setActive(false);
        setMessage("Der Browser kann den Bildschirm gerade nicht wach halten.");
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release();
    };
  }, [enabled, supported]);
  return {
    enabled,
    active,
    supported,
    message,
    toggle: () => setEnabled((v) => !v),
  };
}
