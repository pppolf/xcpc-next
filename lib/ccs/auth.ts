import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentSuper, getCurrentUser, UserJwtPayload } from "@/lib/auth";
import { ContestRole } from "@/lib/generated/prisma/client";

export async function checkCCSAuth(req: NextRequest) {
  // 1. 尝试使用 Basic Auth
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [username, password] = credentials.split(":");

    if (username && password) {
      // Check against GlobalUser (admin)
      const user = await prisma.globalUser.findUnique({
        where: { username },
      });

      if (user && user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) return true;
      }
    }
  }

  // 2. 尝试使用 Cookie Auth (getCurrentUser / getCurrentSuper)
  // 检查是否是超级管理员 (Global Admin)
  const superAdmin = await getCurrentSuper();
  if (
    superAdmin &&
    !(superAdmin instanceof Error) &&
    (superAdmin as UserJwtPayload).isGlobalAdmin
  ) {
    return true;
  }

  // 检查是否是当前比赛的管理员 (Contest Admin)
  // 获取当前请求的 contestId
  // req.nextUrl.pathname 格式通常为 /api/ccs/contests/[contestId]/...
  // 我们需要解析出 contestId
  const match = req.nextUrl.pathname.match(/\/api\/ccs\/contests\/(\d+)/);
  if (match) {
    const contestId = parseInt(match[1], 10);
    const user = await getCurrentUser();

    if (user && !(user instanceof Error)) {
      const payload = user as UserJwtPayload;
      // ContestRole.ADMIN 是 User 表中的角色，不是 GlobalUser
      if (
        payload.role === ContestRole.ADMIN &&
        payload.contestId === contestId
      ) {
        return true;
      }
    }
  }

  return false;
}

export function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CCS API"',
    },
  });
}
