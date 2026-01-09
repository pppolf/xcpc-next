import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. 拦截 /admin 开头的所有路由
  if (path.startsWith("/admin")) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      // 没登录 -> 踢回首页 (或者弹窗登录)
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      // 验证 Token 内容
      const user = await verifyAuth(token);

      // 2. 关键：检查是否是 Global Admin
      if (!user.isGlobalAdmin) {
        // 是普通选手，想偷看后台 -> 403 Forbidden
        return NextResponse.rewrite(new URL("/403", req.url));
      }

      // 验证通过，放行
      return NextResponse.next();
    } catch (err) {
      // Token 无效
      console.log(err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: ["/admin/:path*"],
};
