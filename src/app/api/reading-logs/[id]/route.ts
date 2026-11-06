import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ALLOWED_GENRES } from "@/lib/constants";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Check ownership
  const existing = await prisma.readingLog.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Reading log not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.bookTitle !== undefined) {
      if (typeof body.bookTitle !== "string" || !body.bookTitle.trim()) {
        return NextResponse.json({ error: "Book title is required" }, { status: 400 });
      }
      if (body.bookTitle.trim().length > 80) {
        return NextResponse.json({ error: "Book title must be at most 80 characters" }, { status: 400 });
      }
      updateData.bookTitle = body.bookTitle.trim();
    }

    if (body.minutesRead !== undefined) {
      const numMinutes = Number(body.minutesRead);
      if (isNaN(numMinutes) || !Number.isInteger(numMinutes) || numMinutes <= 0) {
        return NextResponse.json({ error: "Minutes read must be a positive number" }, { status: 400 });
      }
      updateData.minutesRead = numMinutes;
    }

    if (body.genre !== undefined) {
      if (!ALLOWED_GENRES.includes(body.genre)) {
        return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
      }
      updateData.genre = body.genre;
    }

    if (body.note !== undefined) {
      updateData.note = body.note ? String(body.note).trim() : "";
    }

    if (body.favorite !== undefined) {
      updateData.favorite = Boolean(body.favorite);
    }

    if (body.readOn !== undefined || body.date !== undefined) {
      const d = (body.readOn || body.date || "").toString().trim();
      const todayStr = new Date().toISOString().split("T")[0];
      if (d > todayStr) {
        return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
      }
      updateData.readOn = d;
    }

    // Check duplicate if title, minutes, or date is changed
    const targetTitle = updateData.bookTitle ?? existing.bookTitle;
    const targetMinutes = updateData.minutesRead ?? existing.minutesRead;
    const targetDate = updateData.readOn ?? existing.readOn;

    if (
      updateData.bookTitle !== undefined ||
      updateData.minutesRead !== undefined ||
      updateData.readOn !== undefined
    ) {
      const duplicate = await prisma.readingLog.findFirst({
        where: {
          userId: session.id,
          id: { not: id },
          bookTitle: targetTitle,
          minutesRead: targetMinutes,
          readOn: targetDate,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Duplicate reading session: a reading session with the same book title, minutes and date already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.readingLog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        id: updated.id,
        bookTitle: updated.bookTitle,
        minutesRead: updated.minutesRead,
        genre: updated.genre,
        note: updated.note ?? "",
        favorite: updated.favorite,
        readOn: updated.readOn,
        createdAt: updated.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Update reading log error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.readingLog.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Reading log not found" }, { status: 404 });
  }

  await prisma.readingLog.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
