"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame: number;
    let stuckTimer: number | null = null;
    setVisible(true);
    setProgress(0);

    const tick = (start: number) => {
      const elapsed = performance.now() - start;
      // Fast climb to 80%, then slow asymptote
      const target = Math.min(80, (elapsed / 600) * 80);
      setProgress((p) => Math.max(p, target));
      if (target < 80) frame = requestAnimationFrame(() => tick(start));
    };

    frame = requestAnimationFrame(() => tick(performance.now()));

    // Hide bar shortly after route is committed (this effect re-runs)
    stuckTimer = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setVisible(false), 200);
    }, 350);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (stuckTimer) window.clearTimeout(stuckTimer);
    };
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className={`fixed left-0 top-0 z-50 h-[3px] bg-vermillion-600 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        width: `${progress}%`,
        transition: "width 200ms ease-out, opacity 300ms",
        boxShadow: "0 0 8px rgba(193, 39, 45, 0.5)",
      }}
    />
  );
}
