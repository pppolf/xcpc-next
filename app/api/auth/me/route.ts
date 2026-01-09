import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!);
    return NextResponse.json({ user: decoded });
  } catch (e) {
    return NextResponse.json({ user: null, message: e });
  }
}