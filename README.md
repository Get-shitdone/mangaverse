# Mangaverse

A premium reading platform for **manhwa, manga, comics, and novels** — built with Next.js 14, free open APIs, and a Jump-magazine inspired aesthetic.

![Mangaverse](https://img.shields.io/badge/Next.js-14-black) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-live-vermilion)

## What it does

- **Discovery**: Trending now, top manhwa, manhua, novels, by genre, by year — powered by AniList + MyAnimeList
- **Reading**: Real chapter pages from MangaDex with paginated, double-page, or webtoon vertical-scroll modes
- **Library**: Personal watchlist with 5 status buckets (Reading / Plan / Completed / On Hold / Dropped), star ratings, progress tracking — all in localStorage, no account required
- **Continue reading**: Resume any title from where you left off
- **Recommendations**: AniList-powered "you might also like" on every detail page
- **Search**: Type-ahead with live suggestions across all media types

## Stack

- **Next.js 14** App Router · **TypeScript** · **Tailwind CSS**
- **Zustand** for library / progress state (persisted to localStorage)
- **AniList GraphQL**, **MangaDex REST**, **Jikan v4 (MAL)**, **Open Library**, **Google Books** — all free, no keys needed for the core experience
- **next/image** with remote patterns for cover art
- **Vercel**-ready out of the box

## Aesthetic

Manga-native: bold compressed display typography (Bebas Neue, Anton), Noto Serif JP for kanji accents, ink-on-cream palette with vermillion + sumi black, panel-grid layouts with thick borders, halftone backgrounds, asymmetric card grids that echo manga panel composition.

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

## Architecture notes

- **MangaDex Referer requirement** — chapter page images must be served with a `Referer: https://mangadex.org/` header, which browsers can't easily set on `<img>` tags. We route all chapter images through `/api/proxy-image?url=...` which fetches server-side and streams back with proper headers + 24h CDN cache.
- **AniList rate limits** — 90 req/min unauthenticated. We use Next.js ISR (`revalidate: 1800`) on home/browse/detail to stay well under the cap.
- **NSFW handling** — AniList's `isAdult` flag is honored. Default filter is ON; titles get a frosted reveal-on-tap overlay until the user enables NSFW in settings.
- **Comics** — Western comics aren't well-indexed by AniList/MangaDex. The Comics tab uses Comic Vine when a key is provided, otherwise falls back to manga-format comics from the main catalog. Either way the app deploys cleanly.

## Routes

| Route | Description |
| --- | --- |
| `/` | Home with hero, continue-reading, trending, top manhwa/manga/novels |
| `/browse` | Filterable catalog with type/genre/status/sort |
| `/title/[id]` | Detail page with synopsis, chapters, characters, recs |
| `/read/[mediaId]/[chapterId]?md=...` | Chapter reader |
| `/library` | Personal library with status tabs and ratings |
| `/search` | Full search results page |

## Credits

- Metadata via [AniList](https://anilist.co), [MyAnimeList / Jikan](https://jikan.moe), [Open Library](https://openlibrary.org), [Google Books](https://books.google.com)
- Chapter content via [MangaDex](https://mangadex.org) — please support official releases when they exist
- Inspired by Shōnen Jump magazine layout principles

## License

MIT — see LICENSE.
