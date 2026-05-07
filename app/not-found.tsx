import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-cream flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <p className="font-jp text-vermillion-600 text-2xl mb-3">エラー・四〇四</p>
        <h1 className="display-headline text-7xl md:text-9xl text-ink-900 mb-4">
          404
        </h1>
        <p className="text-lg uppercase tracking-widest font-bold text-ink-700 mb-3">
          Chapter Not Found
        </p>
        <p className="text-ink-700 mb-8">
          This page seems to have been left in another volume. Try heading back
          to the home page or search for what you were looking for.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="btn-vermillion">
            Back to Home
          </Link>
          <Link href="/search" className="btn-ghost">
            Search
          </Link>
        </div>
      </div>
    </div>
  );
}
