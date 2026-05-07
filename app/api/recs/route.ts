import { NextRequest, NextResponse } from "next/server";
import { getById } from "@/lib/api/anilist";
import { asPositiveInt } from "@/lib/validate";
import { rateLimitOrReject } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const limited = rateLimitOrReject(req, "recs", { max: 60, refill: 1 });
  if (limited) return limited;

  const idNum = asPositiveInt(req.nextUrl.searchParams.get("id"), 10_000_000);
  if (idNum === null) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  try {
    const m = await getById(idNum);
    return NextResponse.json(
      { results: m.recommendations ?? [] },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=600, s-maxage=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
