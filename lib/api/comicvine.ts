// Comic Vine API — gated on COMICVINE_API_KEY env var. Returns curated fallback
// when no key is present so the route renders cleanly without configuration.

import type { MediaItem } from "@/lib/types";

const COMIC_VINE = "https://comicvine.gamespot.com/api";

const FALLBACK: MediaItem[] = [
  {
    id: "curated:watchmen",
    source: "comicvine",
    type: "comic",
    title: { display: "Watchmen", english: "Watchmen", romaji: null, native: null },
    description:
      "Set in an alternate 1985 America where costumed superheroes are part of the fabric of everyday society, Alan Moore and Dave Gibbons' twelve-issue limited series subverts the masked-vigilante archetype with a sprawling, philosophical, and politically charged mystery.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780930289232-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780930289232-M.jpg",
      color: "#f0c419",
    },
    bannerImage: null,
    genres: ["Superhero", "Mystery", "Drama"],
    tags: ["Alan Moore", "Dave Gibbons", "DC"],
    status: "completed",
    chapters: 12,
    year: 1986,
    score: 95,
    popularity: 95000,
  },
  {
    id: "curated:saga",
    source: "comicvine",
    type: "comic",
    title: { display: "Saga", english: "Saga", romaji: null, native: null },
    description:
      "Brian K. Vaughan and Fiona Staples' epic space opera follows two soldiers from opposing sides of a galactic war as they flee with their newborn daughter. A sweeping family saga that reinvents the genre.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781607066019-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781607066019-M.jpg",
      color: "#7c4275",
    },
    bannerImage: null,
    genres: ["Sci-Fi", "Fantasy", "Drama"],
    tags: ["Brian K. Vaughan", "Fiona Staples", "Image Comics"],
    status: "ongoing",
    year: 2012,
    score: 92,
    popularity: 78000,
  },
  {
    id: "curated:sandman",
    source: "comicvine",
    type: "comic",
    title: { display: "The Sandman", english: "The Sandman", romaji: null, native: null },
    description:
      "Neil Gaiman's masterpiece of comic literature follows Dream of the Endless across millennia, weaving mythology, history, and dark fantasy into one of the most acclaimed graphic novel series ever published.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781401225759-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781401225759-M.jpg",
      color: "#2a2a3e",
    },
    bannerImage: null,
    genres: ["Fantasy", "Horror", "Mythology"],
    tags: ["Neil Gaiman", "Vertigo", "DC"],
    status: "completed",
    chapters: 75,
    year: 1989,
    score: 94,
    popularity: 82000,
  },
  {
    id: "curated:maus",
    source: "comicvine",
    type: "comic",
    title: { display: "Maus", english: "Maus", romaji: null, native: null },
    description:
      "Art Spiegelman's Pulitzer Prize-winning graphic memoir recounts his father's experiences as a Polish Jew and Holocaust survivor. Cats, mice, and an unflinching reckoning with history.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780679748403-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780679748403-M.jpg",
      color: "#2a2a2a",
    },
    bannerImage: null,
    genres: ["Memoir", "Historical", "Drama"],
    tags: ["Art Spiegelman", "Pulitzer", "Pantheon"],
    status: "completed",
    year: 1980,
    score: 96,
    popularity: 65000,
  },
  {
    id: "curated:persepolis",
    source: "comicvine",
    type: "comic",
    title: { display: "Persepolis", english: "Persepolis", romaji: null, native: null },
    description:
      "Marjane Satrapi's autobiographical graphic novel charts her childhood in Iran during the Islamic Revolution and her later life in Europe — a coming-of-age story rendered in stark, woodcut-like black-and-white.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780375422300-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780375422300-M.jpg",
      color: "#c1272d",
    },
    bannerImage: null,
    genres: ["Memoir", "Historical", "Coming-of-Age"],
    tags: ["Marjane Satrapi"],
    status: "completed",
    year: 2000,
    score: 90,
    popularity: 52000,
  },
  {
    id: "curated:y-the-last-man",
    source: "comicvine",
    type: "comic",
    title: { display: "Y: The Last Man", english: "Y: The Last Man", romaji: null, native: null },
    description:
      "Brian K. Vaughan's post-apocalyptic series follows the last man on Earth — and his pet monkey — through a world where every other male mammal has died simultaneously.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781401241773-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781401241773-M.jpg",
      color: "#465a5a",
    },
    bannerImage: null,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    tags: ["Brian K. Vaughan", "Pia Guerra", "Vertigo"],
    status: "completed",
    chapters: 60,
    year: 2002,
    score: 88,
    popularity: 48000,
  },
  {
    id: "curated:invincible",
    source: "comicvine",
    type: "comic",
    title: { display: "Invincible", english: "Invincible", romaji: null, native: null },
    description:
      "Robert Kirkman's deconstruction of the superhero genre. A teenage hero who inherits his father's powers — and learns the cost. Brutal, character-driven, and iconic.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781582408279-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781582408279-M.jpg",
      color: "#e8c842",
    },
    bannerImage: null,
    genres: ["Superhero", "Action", "Drama"],
    tags: ["Robert Kirkman", "Cory Walker", "Image"],
    status: "completed",
    chapters: 144,
    year: 2003,
    score: 91,
    popularity: 71000,
  },
  {
    id: "curated:batman-year-one",
    source: "comicvine",
    type: "comic",
    title: { display: "Batman: Year One", english: "Batman: Year One", romaji: null, native: null },
    description:
      "Frank Miller and David Mazzucchelli's iconic re-telling of Bruce Wayne's first year as Batman, paralleled with Jim Gordon's arrival in Gotham. Definitive noir.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781401207526-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781401207526-M.jpg",
      color: "#1a1a1a",
    },
    bannerImage: null,
    genres: ["Superhero", "Crime", "Noir"],
    tags: ["Frank Miller", "David Mazzucchelli", "DC"],
    status: "completed",
    year: 1987,
    score: 89,
    popularity: 88000,
  },
  {
    id: "curated:daredevil-frank-miller",
    source: "comicvine",
    type: "comic",
    title: { display: "Daredevil: Born Again", english: "Daredevil: Born Again", romaji: null, native: null },
    description:
      "Frank Miller and David Mazzucchelli strip Matt Murdock down to nothing and rebuild him. Often cited as the definitive Daredevil run and a high water mark for the medium.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780785134787-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780785134787-M.jpg",
      color: "#7a1c1c",
    },
    bannerImage: null,
    genres: ["Superhero", "Crime", "Drama"],
    tags: ["Frank Miller", "Marvel"],
    status: "completed",
    year: 1986,
    score: 90,
    popularity: 41000,
  },
  {
    id: "curated:akira",
    source: "comicvine",
    type: "comic",
    title: { display: "Akira", english: "Akira", romaji: "Akira", native: "アキラ" },
    description:
      "Katsuhiro Otomo's cyberpunk epic — a sprawling vision of Neo-Tokyo, psychic powers, and the violence of revolution. The graphic novel that opened Western readers to the scope of manga.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9781935429005-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9781935429005-M.jpg",
      color: "#c1272d",
    },
    bannerImage: null,
    genres: ["Sci-Fi", "Cyberpunk", "Action"],
    tags: ["Katsuhiro Otomo", "Kodansha"],
    status: "completed",
    chapters: 120,
    year: 1982,
    score: 95,
    popularity: 95000,
    countryOfOrigin: "JP",
  },
  {
    id: "curated:from-hell",
    source: "comicvine",
    type: "comic",
    title: { display: "From Hell", english: "From Hell", romaji: null, native: null },
    description:
      "Alan Moore and Eddie Campbell's exhaustive, painstakingly researched dramatization of the Jack the Ripper murders. A meditation on Victorian London's underbelly and the birth of the 20th century.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780958578349-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780958578349-M.jpg",
      color: "#3a3030",
    },
    bannerImage: null,
    genres: ["Historical", "Crime", "Horror"],
    tags: ["Alan Moore", "Eddie Campbell"],
    status: "completed",
    year: 1989,
    score: 91,
    popularity: 38000,
  },
  {
    id: "curated:asterios-polyp",
    source: "comicvine",
    type: "comic",
    title: { display: "Asterios Polyp", english: "Asterios Polyp", romaji: null, native: null },
    description:
      "David Mazzucchelli's masterful graphic novel about a paper architect rebuilding his life. A visual tour-de-force using shape, color, and lettering as character expression.",
    coverImage: {
      large: "https://covers.openlibrary.org/b/isbn/9780307377326-L.jpg",
      medium: "https://covers.openlibrary.org/b/isbn/9780307377326-M.jpg",
      color: "#7d8aa3",
    },
    bannerImage: null,
    genres: ["Drama", "Literary"],
    tags: ["David Mazzucchelli", "Pantheon"],
    status: "completed",
    year: 2009,
    score: 88,
    popularity: 22000,
  },
];

export async function getCuratedComics(): Promise<MediaItem[]> {
  return FALLBACK;
}

export async function getTopComicsFromVine(limit = 12): Promise<MediaItem[]> {
  const key = process.env.COMICVINE_API_KEY;
  if (!key) return FALLBACK.slice(0, limit);

  try {
    const url = new URL(`${COMIC_VINE}/issues/`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "date_added:desc");
    url.searchParams.set(
      "field_list",
      "id,name,issue_number,description,image,cover_date,volume"
    );

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Mangaverse/1.0" },
      next: { revalidate: 21600 }, // 6h
    });
    if (!res.ok) return FALLBACK.slice(0, limit);

    const data = await res.json();
    const items: MediaItem[] = (data.results ?? []).slice(0, limit).map((i: any) => ({
      id: `comicvine:${i.id}`,
      source: "comicvine",
      type: "comic",
      title: {
        display: i.volume?.name
          ? `${i.volume.name} #${i.issue_number ?? "?"}`
          : i.name ?? "Untitled",
        english: i.name ?? null,
        romaji: null,
        native: null,
      },
      description: i.description ? i.description.replace(/<[^>]+>/g, "").slice(0, 300) : null,
      coverImage: {
        large: i.image?.original_url ?? i.image?.super_url ?? null,
        medium: i.image?.medium_url ?? null,
        color: null,
      },
      bannerImage: null,
      genres: ["Comic"],
      tags: [],
      year: i.cover_date ? parseInt(String(i.cover_date).slice(0, 4), 10) : null,
      score: null,
      popularity: null,
    }));
    return items.length ? items : FALLBACK.slice(0, limit);
  } catch {
    return FALLBACK.slice(0, limit);
  }
}
