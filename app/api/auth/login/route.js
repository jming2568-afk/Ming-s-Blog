import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  getBanState,
  recordFailure,
  clearFailures,
  checkPassword,
} from "@/lib/users";
import { createSession } from "@/lib/auth";
import { json500 } from "@/lib/routeHelpers";

// ========== 登录失败惩罚配置（与旧实现一致） ==========
// 5 分钟滑动窗口内 3 次失败 → 首次封禁 5 分钟
// 每次封禁后再次达阈值，当前封禁时长翻倍；上限 2 小时

async function clientIp() {
  const h = await headers();
  const ff = h.get("x-forwarded-for") || "";
  if (ff) return ff.split(",")[0].trim();
  return (h.get("x-real-ip") || h.get("true-client-ip") || "127.0.0.1").trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    const ip = await clientIp();

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const ban = await getBanState(username);
    if (ban.banned) {
      return NextResponse.json(
        {
          error: `登录失败次数过多，已临时封禁，请 ${ban.remainText} 后再试。`,
          remainSec: ban.remainSec,
          remainText: ban.remainText,
        },
        { status: 429 }
      );
    }

    const ok = await checkPassword(username, password);
    if (!ok) {
      await recordFailure(username, ip);
      const after = await getBanState(username);
      if (after.banned) {
        return NextResponse.json(
          {
            error: `用户名或密码错误；已触发临时封禁，${after.remainText} 后再试。`,
            remainSec: after.remainSec,
            remainText: after.remainText,
          },
          { status: 429 }
        );
      }
      const left = Math.max(0, 3 - (after.countInWindow || 0));
      return NextResponse.json(
        {
          error: `用户名或密码错误，再错 ${left} 次将被临时封禁。`,
          attemptsLeft: left,
        },
        { status: 401 }
      );
    }

    await clearFailures(username);

    const { cookieOptions } = await createSession(1); // 单管理员，id = 1
    const cookieStore = await cookies();
    cookieStore.set(cookieOptions);

    return NextResponse.json({
      ok: true,
      user: { id: 1, username },
    });
  } catch (err) {
    return json500(err, { routeName: "auth/login" });
  }
}
