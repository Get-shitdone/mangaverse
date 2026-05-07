"use client";

import { useEffect, useState } from "react";

// Animated boot splash that masks the brief gap between OS hand-off and our
// app's first paint. Shows once per browser session unless the app is launched
// in standalone PWA mode (where every cold start should feel native).
//
// The animation has four beats over ~1.6s:
//   0.0–0.4s  panel pops in, M letter draws
//   0.4–0.9s  speed-line wipe across the panel
//   0.9–1.2s  hold (tagline fades in)
//   1.2–1.6s  whole stage fades out, halftone scatter

const SESSION_KEY = "mangaverse:splash-shown";
const TOTAL_MS = 1600;

function shouldShowSplash(): boolean {
  if (typeof window === "undefined") return false;
  // Always show on standalone PWA cold-start — that's the "native app launch"
  // moment we want to brand. Skip in regular browser sessions after first
  // visit so navigating around the app doesn't replay the splash.
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS-specific
    Boolean(window.navigator.standalone);
  if (isStandalone) return true;
  if (window.sessionStorage.getItem(SESSION_KEY)) return false;
  return true;
}

export function SplashScreen() {
  const [stage, setStage] = useState<"hidden" | "showing" | "fading">("hidden");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!shouldShowSplash()) return;
    setStage("showing");
    const fade = window.setTimeout(() => setStage("fading"), TOTAL_MS - 400);
    const done = window.setTimeout(() => {
      setStage("hidden");
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* storage may be denied in private mode — fine, splash will replay */
      }
    }, TOTAL_MS);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  if (!mounted || stage === "hidden") return null;

  return (
    <div
      role="presentation"
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink-900 splash-stage ${
        stage === "fading" ? "splash-fade" : ""
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Halftone backdrop dots */}
      <div className="absolute inset-0 splash-halftone" aria-hidden />

      {/* Vertical kanji watermark */}
      <p
        aria-hidden
        className="absolute right-6 top-6 writing-vertical font-jp text-[68px] md:text-[140px] font-black leading-none text-cream/[0.06] splash-kanji"
      >
        漫画宇宙
      </p>

      {/* Brand mark */}
      <div className="relative flex flex-col items-center">
        <div className="relative h-[140px] w-[140px] md:h-[180px] md:w-[180px] splash-icon">
          {/* Black drop-shadow plate */}
          <div className="absolute inset-0 translate-x-2 translate-y-2 bg-ink-700" />
          {/* Vermillion panel */}
          <div className="absolute inset-0 border-[3px] border-cream bg-vermillion-600 overflow-hidden splash-panel">
            <div className="absolute inset-0 splash-halftone-light" />
            {/* Speed-line wipe */}
            <div className="absolute inset-0 splash-wipe" />
            {/* Gold corner notch */}
            <div className="absolute bottom-0 right-0 splash-notch" />
            {/* The M */}
            <span className="absolute inset-0 flex items-center justify-center display-headline text-7xl md:text-8xl text-cream leading-none -mt-1 splash-letter">
              M
            </span>
          </div>
        </div>

        {/* Below-icon label fades in late */}
        <p className="splash-label mt-6 font-jp text-vermillion-400 text-xs md:text-sm tracking-widest">
          漫画宇宙
        </p>
      </div>

      <style jsx>{`
        .splash-stage {
          animation: splash-in 0.18s ease-out both;
        }
        .splash-fade {
          animation: splash-out 0.4s ease-in both;
          pointer-events: none;
        }
        @keyframes splash-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splash-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.03); }
        }
        .splash-icon {
          animation: splash-pop 0.42s cubic-bezier(0.16, 1.2, 0.3, 1) both;
        }
        @keyframes splash-pop {
          0% { opacity: 0; transform: scale(0.55) rotate(-6deg); }
          70% { opacity: 1; transform: scale(1.06) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .splash-letter {
          animation: splash-letter 0.6s 0.2s ease-out both;
        }
        @keyframes splash-letter {
          0% { opacity: 0; transform: translateY(20px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .splash-wipe {
          background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(245, 241, 232, 0.85) 50%,
            transparent 60%,
            transparent 100%
          );
          animation: splash-wipe 0.7s 0.45s ease-out both;
        }
        @keyframes splash-wipe {
          0% { transform: translateX(-110%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        .splash-notch {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 30px 30px;
          border-color: transparent transparent #d4af37 transparent;
          animation: splash-notch 0.4s 0.5s ease-out both;
        }
        @keyframes splash-notch {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .splash-label {
          animation: splash-label 0.5s 0.7s ease-out both;
        }
        @keyframes splash-label {
          from { opacity: 0; transform: translateY(8px); letter-spacing: 0.5em; }
          to { opacity: 0.85; transform: translateY(0); letter-spacing: 0.25em; }
        }
        .splash-kanji {
          animation: splash-kanji 0.8s 0.1s ease-out both;
        }
        @keyframes splash-kanji {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .splash-halftone {
          background-image: radial-gradient(rgba(245, 241, 232, 0.06) 1.5px, transparent 1.5px);
          background-size: 14px 14px;
        }
        .splash-halftone-light {
          background-image: radial-gradient(rgba(10, 10, 10, 0.18) 1px, transparent 1px);
          background-size: 8px 8px;
        }
      `}</style>
    </div>
  );
}
