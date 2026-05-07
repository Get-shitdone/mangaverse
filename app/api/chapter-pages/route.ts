import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/sources/aggregator";
import type { SourceId } from "@/lib/sources/types";
import { asSourceId } from "@/lib/validate";
import { rateLimitOrReject } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set<SourceId>([
  "mangadex",
  "consumet-mangakakalot",
  "consumet-mangapill",
  "consumet-mangapark",
  "consumet-mangahere",
  "consumet-mangareader",
  "mangaplus",
]);

export async function GET(req: NextRequest) {
  const limited = rateLimitOrReject(req, "chapter-pages", { max: 90, refill: 2 });
  if (limited) return limited;

  const sourceParam = req.nextUrl.searchParams.get("source") ?? "mangadex";
  if (!ALLOWED_SOURCES.has(sourceParam as SourceId)) {
    return NextResponse.json({ pages: [] }, { status: 400 });
  }
  const source = sourceParam as SourceId;
  const srcId = asSourceId(req.nextUrl.searchParams.get("srcId") ?? "", 200);
  const chapterId = asSourceId(req.nextUrl.searchParams.get("chapterId") ?? "", 200);
  if (!chapterId) {
    return NextResponse.json({ pages: [] }, { status: 400 });
  }

  const adapter = getAdapter(source);
  if (!adapter) {
    return NextResponse.json({ pages: [] }, { status: 404 });
  }

  try {
    const result = await adapter.getPages(srcId ?? "", chapterId);
    return NextResponse.json(result, {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ pages: [] }, { status: 502 });
  }
}
