import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ALLOWED_CATEGORIES } from "@/lib/constants";

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
  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.id },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      if (body.title.trim().length > 80) {
        return NextResponse.json({ error: "Title must be at most 80 characters" }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.amount !== undefined) {
      const numAmount = Number(body.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updateData.amount = Math.round(numAmount * 100) / 100;
    }

    if (body.category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updateData.category = body.category;
    }

    if (body.note !== undefined) {
      updateData.note = body.note ? String(body.note).trim() : "";
    }

    if (body.starred !== undefined) {
      updateData.starred = Boolean(body.starred);
    }

    if (body.spentAt !== undefined || body.date !== undefined) {
      const d = (body.spentAt || body.date || "").toString().trim();
      const todayStr = new Date().toISOString().split("T")[0];
      if (d > todayStr) {
        return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
      }
      updateData.spentAt = d;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        id: updated.id,
        title: updated.title,
        amount: updated.amount,
        category: updated.category,
        note: updated.note ?? "",
        starred: updated.starred,
        spentAt: updated.spentAt,
        createdAt: updated.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Update expense error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.id },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await prisma.expense.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

