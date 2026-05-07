import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t-2 border-ink-900 bg-ink-900 text-cream">
      <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-cream">
              <span className="display-headline text-4xl">
                MANGA<span className="text-vermillion-400">VERSE</span>
                <span className="ml-2 text-sm font-jp">漫画宇宙</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
              A reading platform for manhwa, manga, comics, and novels. Built
              with open APIs from AniList, MangaDex, MyAnimeList, Open Library,
              and Google Books. Free, fast, and ad-free.
            </p>
          </div>

          <div>
            <h4 className="display-headline text-lg text-vermillion-400 mb-4">
              Discover
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse" className="hover:text-vermillion-400">All Titles</Link></li>
              <li><Link href="/browse?country=KR" className="hover:text-vermillion-400">Manhwa</Link></li>
              <li><Link href="/browse?country=JP" className="hover:text-vermillion-400">Manga</Link></li>
              <li><Link href="/browse?country=CN" className="hover:text-vermillion-400">Manhua</Link></li>
              <li><Link href="/browse?format=NOVEL" className="hover:text-vermillion-400">Novels</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="display-headline text-lg text-vermillion-400 mb-4">
              About
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-vermillion-400">About Mangaverse</Link></li>
              <li><Link href="/library" className="hover:text-vermillion-400">My Library</Link></li>
              <li><a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="hover:text-vermillion-400">Powered by AniList</a></li>
              <li><a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="hover:text-vermillion-400">Chapters via MangaDex</a></li>
              <li><a href="https://github.com/Get-shitdone/mangaverse" target="_blank" rel="noopener noreferrer" className="hover:text-vermillion-400">View on GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-cream/20 pt-8 md:flex-row md:items-center">
          <div className="text-xs uppercase tracking-widest text-cream/60 space-y-1">
            <p>
              Made with ink &amp; pixels by{" "}
              <a
                href="https://www.facebook.com/isDevGit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vermillion-400 font-bold hover:text-cream"
              >
                Get-shitdone
              </a>
            </p>
            <p className="text-cream/40">Cover art &amp; metadata © respective publishers.</p>
          </div>
          <p className="font-jp text-xs text-cream/50">
            読書を楽しもう
          </p>
        </div>
      </div>
    </footer>
  );
}
