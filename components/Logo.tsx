import Link from "next/link";

export function Logo({ size = "default" }: { size?: "default" | "small" | "large" }) {
  const cls =
    size === "large"
      ? "text-5xl"
      : size === "small"
      ? "text-xl"
      : "text-2xl md:text-3xl";

  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <span className="relative">
        <span
          className={`display-headline ${cls} font-bold tracking-tight text-ink-900 group-hover:text-vermillion-600 transition-colors`}
        >
          MANGA
          <span className="text-vermillion-600 group-hover:text-ink-900 transition-colors">
            VERSE
          </span>
        </span>
        <span className="absolute -top-1 -right-3 text-[8px] font-jp text-ink-700">
          漫画
        </span>
      </span>
    </Link>
  );
}
