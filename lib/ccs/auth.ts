import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function checkCCSAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  if (!username || !password) {
    return false;
  }

  // Check against GlobalUser (admin)
  const user = await prisma.globalUser.findUnique({
    where: { username },
  });

  if (!user || !user.password) {
    return false;
  }

  const isValid = await bcrypt.compare(password, user.password);
  return isValid;
}

export function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CCS API"',
    },
  });
}
