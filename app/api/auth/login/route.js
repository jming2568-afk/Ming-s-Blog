import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import getDb, { ensureDb } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { json500, normalizeError } from "@/lib/routeHelpers";

// ========== 登录失败惩罚配置 ==========
// 5 分钟滑动窗口内 3 次失败 → 首次封禁 5 分钟
// 每次封禁后再次达阈值，当前封禁时长翻倍；上限 2 小时
const FAIL_WINDOW_SEC = 5 * 60;       // 5 min
const FAIL_THRESHOLD = 3;             // 3 次
const BASE_BAN_SEC = 5 * 60;          // 5 min
const MAX_BAN_SEC = 2 * 60 * 60;      // 2 h

async function clientIp() {
  const h = await headers();
  const ff = h.get("x-forwarded-for") || "";
  if (ff) return ff.split(",")[0].trim();
  return (h.get("x-real-ip") || h.get("true-client-ip") || "127.0.0.1").trim();
}

function formatSec(total) {
  if (total <= 0) return "很快";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h) parts.push(`${h} 小时`);
  if (m) parts.push(`${m} 分`);
  if (!h && s) parts.push(`${s} 秒`);
  return parts.join("") || "1 分";
}

function getBanState(db, username) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - FAIL_WINDOW_SEC;

  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_failures WHERE username = ? AND failed_at >= ?`
    )
    .get(username, windowStart);
  const countInWindow = row?.c || 0;

  const SEVEN_DAYS = 7 * 24 * 3600;
  const totalIn7d = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_failures WHERE username = ? AND failed_at >= ?`
    )
    .get(username, now - SEVEN_DAYS)?.c || 0;
  const banLevel = Math.max(0, Math.floor(totalIn7d / FAIL_THRESHOLD) - 1);
  if (countInWindow < FAIL_THRESHOLD) {
    return { banned: false, countInWindow, banLevel };
  }

  const currentBanSec = Math.min(MAX_BAN_SEC, BASE_BAN_SEC * Math.pow(2, banLevel));

  const last = db
    .prepare(
      `SELECT MAX(failed_at) AS t FROM login_failures WHERE username = ? AND failed_at >= ?`
    )
    .get(username, windowStart);
  const lastFailedAt = last?.t || now;
  const banUntil = lastFailedAt + currentBanSec;
  const remain = banUntil - now;

  return {
    banned: remain > 0,
    remainSec: remain,
    remainText: formatSec(remain),
    countInWindow,
    banLevel,
    currentBanSec,
  };
}

function recordFailure(db, username, ip) {
  db.prepare(
    `INSERT INTO login_failures (username, ip, failed_at) VALUES (?, ?, ?)`
  ).run(username, ip, Math.floor(Date.now() / 1000));
}

function clearFailures(db, username) {
  db.prepare(`DELETE FROM login_failures WHERE username = ?`).run(username);
}

const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST(req) {
  try {
    // 关键：把 DB 初始化从模块顶层移到 handler 内部，用 try/catch 包起来返回 JSON 500
    try {
      ensureDb();
    } catch (dbErr) {
      const { message } = normalizeError(dbErr);
      console.error("[auth/login] db init error:", message, dbErr);
      return NextResponse.json(
        {
          error: "数据库初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
        },
        { status: 500 }
      );
    }
    const db = getDb();

    const body = await req.json();
    const { username, password } = body || {};
    const ip = await clientIp();

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const ban = getBanState(db, username);
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

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      recordFailure(db, username, ip);
      const after = getBanState(db, username);
      if (after.banned) {
        return NextResponse.json(
          {
            error: `用户名或密码错误；且触发临时封禁，${after.remainText} 后再试。`,
            remainSec: after.remainSec,
            remainText: after.remainText,
          },
          { status: 429 }
        );
      }
      const left = Math.max(0, FAIL_THRESHOLD - (after.countInWindow || 0));
      return NextResponse.json(
        {
          error: `用户名或密码错误，再错 ${left} 次将被临时封禁。`,
          attemptsLeft: left,
        },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      recordFailure(db, username, ip);
      const after = getBanState(db, username);
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
      const left = Math.max(0, FAIL_THRESHOLD - (after.countInWindow || 0));
      return NextResponse.json(
        {
          error: `用户名或密码错误，再错 ${left} 次将被临时封禁。`,
          attemptsLeft: left,
        },
        { status: 401 }
      );
    }

    clearFailures(db, username);

    const { cookieOptions } = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(cookieOptions);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    return json500(err, { routeName: "auth/login" });
  }
}
