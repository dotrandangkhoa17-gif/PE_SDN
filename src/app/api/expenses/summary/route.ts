import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const CATEGORY_TIE_BREAK: Record<string, number> = {
  Food: 1,
  Transport: 2,
  Bills: 3,
  Shopping: 4,
  Other: 5,
};

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category");
  const starredParam = searchParams.get("starred");
  const qParam = searchParams.get("q");

  const whereClause: any = {
    userId: session.id,
  };

  if (categoryParam && categoryParam.trim()) {
    whereClause.category = categoryParam.trim();
  }

  if (starredParam === "true") {
    whereClause.starred = true;
  }

  if (qParam && qParam.trim()) {
    const q = qParam.trim();
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
  });

  if (expenses.length === 0) {
    return NextResponse.json(
      {
        count: 0,
        starredCount: 0,
        totalAmount: 0,
        breakdown: [],
      },
      { status: 200 }
    );
  }

  let totalAmount = 0;
  let starredCount = 0;
  const breakdownMap: Record<string, { count: number; total: number }> = {};

  for (const item of expenses) {
    totalAmount += item.amount;
    if (item.starred) starredCount++;

    if (!breakdownMap[item.category]) {
      breakdownMap[item.category] = { count: 0, total: 0 };
    }
    breakdownMap[item.category].count += 1;
    breakdownMap[item.category].total += item.amount;
  }

  const breakdown = Object.entries(breakdownMap).map(([cat, data]) => ({
    category: cat,
    count: data.count,
    total: Math.round(data.total * 100) / 100,
  }));

  breakdown.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total; // descending
    }
    const orderA = CATEGORY_TIE_BREAK[a.category] ?? 99;
    const orderB = CATEGORY_TIE_BREAK[b.category] ?? 99;
    return orderA - orderB;
  });

  return NextResponse.json(
    {
      count: expenses.length,
      starredCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      breakdown,
    },
    { status: 200 }
  );
}

