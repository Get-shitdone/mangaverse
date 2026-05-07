import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Mangaverse";
  const subtitle = searchParams.get("subtitle") ?? "Manhwa · Manga · Comics · Novels";
  const cover = searchParams.get("cover");
  const accent = searchParams.get("accent") ?? "#c1272d";
  const type = searchParams.get("type") ?? "FEATURED";
  const score = searchParams.get("score");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#f5f1e8",
          fontFamily: "Inter, system-ui",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Halftone */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(10,10,10,0.08) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
            display: "flex",
          }}
        />

        {/* Cover panel */}
        {cover && (
          <div
            style={{
              width: "420px",
              height: "100%",
              borderRight: "4px solid #0a0a0a",
              background: accent,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              width={420}
              height={630}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
        )}

        {/* Text panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "60px",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Top */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  background: "#c1272d",
                  color: "#f5f1e8",
                  padding: "8px 14px",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  border: "2px solid #0a0a0a",
                }}
              >
                {type}
              </div>
              {score && (
                <div
                  style={{
                    display: "flex",
                    color: "#0a0a0a",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  ★ {score}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: cover ? 72 : 88,
                fontWeight: 900,
                lineHeight: 0.95,
                color: "#0a0a0a",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                fontStretch: "condensed",
                display: "flex",
                wordBreak: "break-word",
              }}
            >
              {title.length > 60 ? title.slice(0, 57) + "…" : title}
            </div>

            <div
              style={{
                marginTop: 24,
                fontSize: 22,
                color: "#404040",
                lineHeight: 1.4,
                display: "flex",
              }}
            >
              {subtitle.length > 100 ? subtitle.slice(0, 97) + "…" : subtitle}
            </div>
          </div>

          {/* Bottom — brand */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              borderTop: "3px solid #0a0a0a",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 900,
                color: "#0a0a0a",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              MANGA<span style={{ color: "#c1272d" }}>VERSE</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#737373",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              mangaverse.app
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
