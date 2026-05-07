import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Keep `name` short — Android Chrome's auto-generated splash screen renders
    // this string verbatim under the icon, and there's no manifest field that
    // suppresses it. The longer pitch lives in `description` so install
    // prompts and search engines still surface it.
    name: "Mangaverse",
    short_name: "Mangaverse",
    description:
      "A premium reading platform for manhwa, manga, comics, and novels with offline reading, multi-source aggregation, and a Jump-magazine inspired interface.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["entertainment", "books", "lifestyle", "comics"],
    lang: "en-US",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Read Now",
        short_name: "Read Now",
        description: "Just-updated chapters from MangaDex",
        url: "/read-now",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My Library",
        short_name: "Library",
        description: "Continue reading where you left off",
        url: "/library",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Browse",
        short_name: "Browse",
        description: "Explore the full catalog",
        url: "/browse",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    prefer_related_applications: false,
  };
}
