import { NextRequest, NextResponse } from "next/server";
import { getById } from "@/lib/api/anilist";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ results: [] });
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) return NextResponse.json({ results: [] });

  try {
    const m = await getById(idNum);
    return NextResponse.json({ results: m.recommendations ?? [] });
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message }, { status: 500 });
  }
}
