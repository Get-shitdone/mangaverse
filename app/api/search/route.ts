import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/api/anilist";
import { asTrimmedString } from "@/lib/validate";
import { rateLimitOrReject } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const limited = rateLimitOrReject(req, "search", { max: 30, refill: 0.5 });
  if (limited) return limited;

  const raw = req.nextUrl.searchParams.get("q");
  const q = asTrimmedString(raw, 80);
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await search(q, 10);
    return NextResponse.json(
      { results },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=60, s-maxage=600",
        },
      }
    );
  } catch {
    // Don't echo upstream messages — keep the surface minimal.
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
