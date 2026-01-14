import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const auth_token = cookieStore.get("auth_token");
  const user_token = cookieStore.get("user_token");

  if (!auth_token && !user_token) {
    return NextResponse.json({ user: null });
  } else {
    if (auth_token) {
      try {
        const decoded = jwt.verify(auth_token.value, process.env.JWT_SECRET!);
        return NextResponse.json({ user: decoded });
      } catch (e) {
        return NextResponse.json({ user: null, message: e });
      }
    } else if (user_token) {
      try {
        const decoded = jwt.verify(user_token.value, process.env.JWT_SECRET!);
        return NextResponse.json({ user: decoded });
      } catch (e) {
        return NextResponse.json({ user: null, message: e });
      }
    }
  }
}
