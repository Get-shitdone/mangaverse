import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/read/", "/read-novel/"],
      },
    ],
    sitemap: "https://mangaverse-lac.vercel.app/sitemap.xml",
  };
}
