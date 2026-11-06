import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ALLOWED_GENRES } from "@/lib/constants";

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

  // Ordering: readOn descending; ties broken by bookTitle alphabetically (case-insensitive)
  logs.sort((a, b) => {
    if (a.readOn !== b.readOn) {
      return b.readOn.localeCompare(a.readOn);
    }
    return a.bookTitle.localeCompare(b.bookTitle, undefined, { sensitivity: "base" });
  });

  const formatted = logs.map((item) => ({
    id: item.id,
    bookTitle: item.bookTitle,
    minutesRead: item.minutesRead,
    genre: item.genre,
    note: item.note ?? "",
    favorite: item.favorite,
    readOn: item.readOn,
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
    const { bookTitle, minutesRead, genre, note, readOn, date } = body;

    const actualDate = (readOn || date || "").toString().trim();

    // 1. Book Title Validation
    if (!bookTitle || typeof bookTitle !== "string" || !bookTitle.trim()) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }
    const trimmedTitle = bookTitle.trim();
    if (trimmedTitle.length > 80) {
      return NextResponse.json({ error: "Book title must be at most 80 characters" }, { status: 400 });
    }

    // 2. Minutes Read Validation
    if (minutesRead === undefined || minutesRead === null || minutesRead === "" || isNaN(Number(minutesRead))) {
      return NextResponse.json({ error: "Minutes read is required" }, { status: 400 });
    }
    const numMinutes = Number(minutesRead);
    if (!Number.isInteger(numMinutes) || numMinutes <= 0) {
      return NextResponse.json({ error: "Minutes read must be a positive number" }, { status: 400 });
    }

    // 3. Genre Validation
    if (!genre || typeof genre !== "string" || !genre.trim()) {
      return NextResponse.json({ error: "Please choose a genre" }, { status: 400 });
    }
    if (!ALLOWED_GENRES.includes(genre as any)) {
      return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
    }

    // 4. Date Validation
    if (!actualDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const todayStr = new Date().toISOString().split("T")[0];
    if (actualDate > todayStr) {
      return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    }

    // 5. Duplicate Check
    const existing = await prisma.readingLog.findFirst({
      where: {
        userId: session.id,
        bookTitle: trimmedTitle,
        minutesRead: numMinutes,
        readOn: actualDate,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate reading session: a reading session with the same book title, minutes and date already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.readingLog.create({
      data: {
        userId: session.id,
        bookTitle: trimmedTitle,
        minutesRead: numMinutes,
        genre,
        note: (note ?? "").toString().trim(),
        readOn: actualDate,
        favorite: false,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        bookTitle: created.bookTitle,
        minutesRead: created.minutesRead,
        genre: created.genre,
        note: created.note ?? "",
        favorite: created.favorite,
        readOn: created.readOn,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create reading log error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
