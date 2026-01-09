import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  const serializedCookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // 立即过期
    path: "/",
  });

  return NextResponse.json({ success: true }, { headers: { "Set-Cookie": serializedCookie } });
}