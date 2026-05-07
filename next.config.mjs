/** @type {import('next').NextConfig} */

// Security headers applied to every response.
//
// Honest scope of each:
//   Strict-Transport-Security  — force HTTPS for 2 years; preload-eligible
//   X-Content-Type-Options     — block MIME sniffing on the proxied bytes
//   X-Frame-Options            — same-origin only; prevents click-jacking
//   Referrer-Policy            — leak only the origin to upstream APIs
//   Permissions-Policy         — disable APIs we don't use (cam/mic/geo)
//   X-DNS-Prefetch-Control     — opt-in DNS prefetch
//
// We deliberately don't ship a strict CSP yet because the reader streams
// images from many CDNs through the proxy, and any misstep would silently
// break chapter rendering. We can add a report-only CSP in a later pass.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Help screen readers and route changes feel like a real app
  { key: "X-XSS-Protection", value: "0" }, // disabled per OWASP modern guidance
];

const nextConfig = {
  reactStrictMode: true,
  // Don't advertise Next.js to attackers
  poweredByHeader: false,
  // Compress responses at the edge
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img.anili.st" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "comicvine.gamespot.com" },
      { protocol: "https", hostname: "static.comicvine.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Service worker must be served with no caching to allow updates and
        // its scope must be /, not /sw.js. Both Vercel and Next handle this.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
