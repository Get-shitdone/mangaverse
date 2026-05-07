import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/sources/aggregator";
import type { SourceId } from "@/lib/sources/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const source = (req.nextUrl.searchParams.get("source") ?? "mangadex") as SourceId;
  const srcId = req.nextUrl.searchParams.get("srcId") ?? "";
  const chapterId = req.nextUrl.searchParams.get("chapterId");
  if (!chapterId) {
    return NextResponse.json({ pages: [] }, { status: 400 });
  }

  const adapter = getAdapter(source);
  if (!adapter) {
    return NextResponse.json({ pages: [] }, { status: 404 });
  }

  try {
    const result = await adapter.getPages(srcId, chapterId);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (e) {
    return NextResponse.json(
      { pages: [], error: (e as Error).message },
      { status: 500 }
    );
  }
}
