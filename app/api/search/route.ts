import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/api/anilist";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await search(q, 10);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { results: [], error: (e as Error).message },
      { status: 500 }
    );
  }
}
