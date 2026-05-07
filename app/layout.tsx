import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { bebas, anton, inter, dmSerif, notoJp } from "@/lib/fonts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteProgress } from "@/components/RouteProgress";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mangaverse-lac.vercel.app"),
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
    images: [
      {
        url: "/api/og?title=Mangaverse&subtitle=Manhwa%20%C2%B7%20Manga%20%C2%B7%20Comics%20%C2%B7%20Novels&type=READING%20PLATFORM",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mangaverse",
    description: "A premium reading platform for manhwa, manga, comics, and novels.",
    images: ["/api/og?title=Mangaverse&subtitle=Manhwa%20%C2%B7%20Manga%20%C2%B7%20Comics%20%C2%B7%20Novels&type=READING%20PLATFORM"],
  },
  // PWA + favicon plumbing
  manifest: "/manifest.webmanifest",
  applicationName: "Mangaverse",
  appleWebApp: {
    capable: true,
    title: "Mangaverse",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  // Match the manifest theme so the iOS/Android status bar tints with the app.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  // Allow the user to zoom (a11y) but cap so layouts don't break.
  maximumScale: 5,
  // Cover the iOS notch / Android camera cutout.
  viewportFit: "cover",
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
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <ServiceWorkerRegister />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <InstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
