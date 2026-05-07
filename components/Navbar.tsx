"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { Search, Library, Compass, BookOpen, Menu, X, Layers } from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/comics", label: "Comics", icon: Layers },
  { href: "/library", label: "Library", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hide navbar on reader routes
  if (pathname?.startsWith("/read/")) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b-2 border-ink-900 transition-all backdrop-blur",
        scrolled ? "bg-cream/95 shadow-ink" : "bg-cream"
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-8">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors",
                  active
                    ? "text-vermillion-600"
                    : "text-ink-900 hover:text-vermillion-600"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-[2px] left-1/2 h-[3px] w-6 -translate-x-1/2 bg-vermillion-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-cream transition-all hover:bg-ink-900 hover:text-cream"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-cream"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t-2 border-ink-900 bg-cream px-4 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-3 text-sm font-bold uppercase tracking-widest border-b border-ink-200 last:border-b-0",
                  active ? "text-vermillion-600" : "text-ink-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
