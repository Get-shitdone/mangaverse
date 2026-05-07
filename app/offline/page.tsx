import Link from "next/link";
import { WifiOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] bg-cream flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border-4 border-ink-900 bg-cream-100 halftone-bg">
          <WifiOff className="h-10 w-10 text-vermillion-600" />
        </div>
        <p className="font-jp text-vermillion-600 text-2xl mb-3">オフライン</p>
        <h1 className="display-headline text-5xl md:text-7xl text-ink-900 mb-4">
          You&apos;re offline
        </h1>
        <p className="text-ink-700 mb-8">
          Don&apos;t worry — chapters you&apos;ve already opened are saved on this
          device. Open your library to keep reading what you&apos;ve cached.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/library" className="btn-vermillion">
            Open library
          </Link>
          <Link href="/" className="btn-ghost">
            Try home page
          </Link>
        </div>
      </div>
    </div>
  );
}
