"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] bg-cream flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <p className="font-jp text-vermillion-600 text-2xl mb-3">エラー</p>
        <h1 className="display-headline text-6xl md:text-8xl text-ink-900 mb-4">
          Oops
        </h1>
        <p className="text-lg uppercase tracking-widest font-bold text-ink-700 mb-3">
          Something went off-panel
        </p>
        <p className="text-ink-700 mb-8 text-sm">
          {error.message ?? "An unexpected error occurred."}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => reset()} className="btn-vermillion">
            Try Again
          </button>
          <Link href="/" className="btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
