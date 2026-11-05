import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ALLOWED_CATEGORIES } from "@/lib/constants";

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

  // Sort by spentAt desc, ties broken by title alphabetically (case-insensitive)
  expenses.sort((a, b) => {
    if (a.spentAt !== b.spentAt) {
      return b.spentAt.localeCompare(a.spentAt);
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  const formatted = expenses.map((item) => ({
    id: item.id,
    title: item.title,
    amount: item.amount,
    category: item.category,
    note: item.note ?? "",
    starred: item.starred,
    spentAt: item.spentAt,
    createdAt: item.createdAt.toISOString(),
  }));

  return NextResponse.json(formatted, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, amount, category, note, spentAt, date } = body;

    const actualDate = (spentAt || date || "").toString().trim();

    // Validation: Title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 80) {
      return NextResponse.json({ error: "Title must be at most 80 characters" }, { status: 400 });
    }

    // Validation: Amount
    if (amount === undefined || amount === null || amount === "" || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    // Validation: Category
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Please choose a category" }, { status: 400 });
    }
    if (!ALLOWED_CATEGORIES.includes(category as any)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validation: Date
    if (!actualDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (actualDate > todayStr) {
      return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    }

    // Duplicate Check: Same title, amount, spentAt for this user
    const existing = await prisma.expense.findFirst({
      where: {
        userId: session.id,
        title: trimmedTitle,
        amount: numAmount,
        spentAt: actualDate,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate expense: an expense with the same title, amount and date already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.expense.create({
      data: {
        userId: session.id,
        title: trimmedTitle,
        amount: Math.round(numAmount * 100) / 100,
        category,
        note: (note ?? "").toString().trim(),
        spentAt: actualDate,
        starred: false,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        title: created.title,
        amount: created.amount,
        category: created.category,
        note: created.note ?? "",
        starred: created.starred,
        spentAt: created.spentAt,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create expense error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

