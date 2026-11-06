import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { GENRE_TIE_BREAK } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const genreParam = searchParams.get("genre");
  const favoriteParam = searchParams.get("favorite");
  const qParam = searchParams.get("q");

  const whereClause: any = {
    userId: session.id,
  };

  if (genreParam && genreParam.trim()) {
    whereClause.genre = genreParam.trim();
  }

  if (favoriteParam === "true") {
    whereClause.favorite = true;
  }

  if (qParam && qParam.trim()) {
    const q = qParam.trim();
    whereClause.OR = [
      { bookTitle: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.readingLog.findMany({
    where: whereClause,
  });

  if (logs.length === 0) {
    return NextResponse.json(
      {
        count: 0,
        favoriteCount: 0,
        totalMinutes: 0,
        breakdown: [],
      },
      { status: 200 }
    );
  }

  let totalMinutes = 0;
  let favoriteCount = 0;
  const breakdownMap: Record<string, { count: number; total: number }> = {};

  for (const item of logs) {
    totalMinutes += item.minutesRead;
    if (item.favorite) favoriteCount++;

    if (!breakdownMap[item.genre]) {
      breakdownMap[item.genre] = { count: 0, total: 0 };
    }
    breakdownMap[item.genre].count += 1;
    breakdownMap[item.genre].total += item.minutesRead;
  }

  const breakdown = Object.entries(breakdownMap).map(([genre, data]) => ({
    genre,
    count: data.count,
    total: data.total,
  }));

  breakdown.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total; // descending total minutes
    }
    const orderA = GENRE_TIE_BREAK[a.genre] ?? 99;
    const orderB = GENRE_TIE_BREAK[b.genre] ?? 99;
    return orderA - orderB;
  });

  return NextResponse.json(
    {
      count: logs.length,
      favoriteCount,
      totalMinutes,
      breakdown,
    },
    { status: 200 }
  );
}
