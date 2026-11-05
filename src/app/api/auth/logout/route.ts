import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set(COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}


