import type { MetadataRoute } from "next";
import { ALL_GENRES } from "@/lib/api/anilist";

const BASE = "https://mangaverse-lac.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const routes = ["", "/browse", "/comics", "/library", "/search"];

  const base: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: r === "" ? 1.0 : 0.8,
  }));

  const genres: MetadataRoute.Sitemap = ALL_GENRES.map((g) => ({
    url: `${BASE}/genre/${encodeURIComponent(g)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...base, ...genres];
}
