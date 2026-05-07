# Mangaverse

A premium reading platform for **manhwa, manga, comics, and novels** — built with Next.js 14, free open APIs, and a Jump-magazine inspired aesthetic.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-live-vermilion)

**Live:** https://mangaverse-lac.vercel.app

## Features

### Discovery
- Trending now, top manhwa / manhua / novels, by genre, by year — powered by AniList + MyAnimeList
- Curated comics canon (Watchmen, Saga, Sandman, Maus…) plus Comic Vine integration when key is provided
- 19 dedicated genre landing pages (`/genre/Action`, `/genre/Romance`, etc.) with related-genre rails

### Reading
- **Manga / manhwa reader** with paginated, double-page, and webtoon-vertical scroll modes
- **Novel reader** with full text from Project Gutenberg (public-domain titles), preview + publisher link-out for the rest, three themes (cream / sepia / dark), adjustable typography
- Real chapter pages from MangaDex, served through an image proxy that handles the Referer requirement
- Keyboard nav (← / → / Space / F / Esc), tap zones, idle UI hide, fullscreen, chapter drawer, settings panel

### Library
- Personal watchlist with 5 status buckets (Reading / Plan / Completed / On Hold / Dropped)
- Star ratings (1-5), notes, progress tracking — all in localStorage, no account required
- **Reading stats dashboard**: chapters read, estimated hours, completion rate, status breakdown, format distribution
- **Export / Import JSON** to back up or sync between devices
- Full library wipe with two-step confirmation

### Personalization
- Continue Reading row pulled from progress store
- "Because you read X" personalized recommendation rows on home (kicks in once 2+ titles in library)
- Hover badges with manga sound effects (BAM!, POW!, WHAM!) randomized per cover

### Search & SEO
- Type-ahead search across all media types with debounced live suggestions
- Dynamic OpenGraph image route (`/api/og`) renders editorial-style social cards per title
- JSON-LD structured data on every detail page (Book / ComicSeries schema)
- Sitemap, robots.txt, Vercel Analytics + Speed Insights wired in

## Stack

- **Next.js 14** App Router · **TypeScript** · **Tailwind CSS** · **Edge OG**
- **Zustand** for library / progress / preferences state (persisted to localStorage)
- **AniList GraphQL**, **MangaDex REST**, **Jikan v4 (MAL)**, **Open Library**, **Google Books**, **Project Gutenberg (Gutendex)** — all free, no keys needed for the core experience
- **Comic Vine** is optional and gated behind `COMICVINE_API_KEY`
- **next/image** with remote patterns for cover art
- **@vercel/og** for dynamic social cards
- **Vercel-ready** out of the box

## Aesthetic

Manga-native, Jump-magazine elevated:
- Bold compressed display typography (Bebas Neue, Anton)
- Noto Serif JP for kanji accents
- Ink-on-cream palette with vermillion + sumi black
- Panel-grid layouts with thick borders, halftone backgrounds
- Asymmetric card grids that echo manga panel composition
- Hover effects with rotated sound-effect badges
- Kanji-themed loading states (`読` for "reading")

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables (optional)

Everything works without any environment variables. Create `.env.local` only if you want enhanced features:

```bash
COMICVINE_API_KEY=        # for richer comics catalog (free key from comicvine.gamespot.com)
GOOGLE_BOOKS_API_KEY=     # for higher rate limits on novel previews
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or click the Vercel deploy button on this repo and connect your GitHub account.

## Routes

| Route | Description |
| --- | --- |
| `/` | Home with hero, continue-reading, personalized recs, trending, comics canon |
| `/browse` | Filterable catalog with type/genre/status/sort |
| `/comics` | Curated comic canon + Comic Vine new issues |
| `/genre/[name]` | Genre landing page with hero + categorized rails |
| `/title/[id]` | Detail page with synopsis, chapters, characters, recs, JSON-LD |
| `/read/[mediaId]/[chapterId]?md=...` | Manga / manhwa chapter reader |
| `/read-novel/[mediaId]` | Novel reader with type controls and themes |
| `/library` | Personal library with status tabs and ratings |
| `/library/stats` | Reading stats dashboard |
| `/library/settings` | Export / import / wipe |
| `/search` | Full search results page |
| `/api/og` | Dynamic OpenGraph image generator (Edge runtime) |
| `/api/recs` | Personalized recommendations API |
| `/api/search` | Type-ahead search API |
| `/api/proxy-image` | MangaDex image proxy with proper Referer |
| `/sitemap.xml`, `/robots.txt` | SEO essentials |

## Architecture notes

- **MangaDex Referer requirement** — chapter page images need a `Referer: https://mangadex.org/` header that browsers can't easily set on `<img>` tags. We route all chapter images through `/api/proxy-image?url=...` which fetches server-side with proper headers + 24h CDN cache.
- **AniList rate limits** — 90 req/min unauthenticated. We use Next.js ISR (`revalidate: 1800`) on home/browse/detail to stay well under the cap.
- **NSFW handling** — AniList's `isAdult` flag is honored. Default filter is ON; titles get a frosted reveal-on-tap overlay until the user enables NSFW in settings.
- **Comics** — Western comics aren't well-indexed by AniList/MangaDex. The Comics tab uses a curated canon by default, augmented with Comic Vine when a key is provided.
- **Novels** — Project Gutenberg provides full text for public-domain titles (~70K+ books). For modern novels, we show a preview from Google Books / Open Library and link out to the publisher.
- **Zustand selector pattern** — Selectors must return raw state; derived helpers (`recentProgress`, `libraryByStatus`) are exported as utility functions to avoid the new-array-every-call infinite-render trap.

## Credits

- Metadata via [AniList](https://anilist.co), [MyAnimeList / Jikan](https://jikan.moe), [Open Library](https://openlibrary.org), [Google Books](https://books.google.com), [Project Gutenberg / Gutendex](https://gutendex.com)
- Chapter content via [MangaDex](https://mangadex.org) — please support official releases when they exist
- Comic Vine optional integration via [comicvine.gamespot.com](https://comicvine.gamespot.com/api)
- Inspired by Shōnen Jump magazine layout principles

## License

MIT — see LICENSE.
