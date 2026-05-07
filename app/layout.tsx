import type { Metadata, Viewport } from "next";
import { bebas, anton, inter, dmSerif, notoJp } from "@/lib/fonts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mangaverse.vercel.app"),
  title: {
    default: "Mangaverse — Read Manhwa, Manga, Comics & Novels",
    template: "%s · Mangaverse",
  },
  description:
    "A premium reading platform for manhwa, manga, comics, and novels. Discover trending titles, track your library, and read chapters with a Jump-magazine inspired interface.",
  keywords: [
    "manga",
    "manhwa",
    "manhua",
    "comics",
    "novels",
    "light novels",
    "anime",
    "read manga online",
    "manga reader",
  ],
  openGraph: {
    title: "Mangaverse",
    description:
      "Read manhwa, manga, comics, and novels with a Jump-magazine inspired interface.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mangaverse",
    description: "A premium reading platform for manhwa, manga, comics, and novels.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f1e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${anton.variable} ${inter.variable} ${dmSerif.variable} ${notoJp.variable}`}
    >
      <body className="min-h-screen bg-cream text-ink-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
