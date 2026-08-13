import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import db, { ensureTables, ensureDefaultUsers } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

ensureTables();
ensureDefaultUsers();

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

function getBanState(username) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - FAIL_WINDOW_SEC;

  // 1. 先算过去窗口内失败次数
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_failures WHERE username = ? AND failed_at >= ?`
    )
    .get(username, windowStart);
  const countInWindow = row?.c || 0;

  // 2. 算历史累计封禁等级（> 窗口外的也计入，惩罚翻倍是长期记忆）
  // 封禁等级 = floor(最近 7 天内达到阈值的次数)，用 最近 N 次失败 倒推
  // 简化：统计 7 天内失败总次数 / 阈值，得到已翻倍层数
  const SEVEN_DAYS = 7 * 24 * 3600;
  const totalIn7d = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_failures WHERE username = ? AND failed_at >= ?`
    )
    .get(username, now - SEVEN_DAYS)?.c || 0;
  const banLevel = Math.max(0, Math.floor(totalIn7d / FAIL_THRESHOLD) - 1);
  // 注意：若当前窗口内还没到阈值，不应该封禁（用户可能刚超过 7 天记忆的次数但当前窗口还没 3 次）
  if (countInWindow < FAIL_THRESHOLD) {
    return { banned: false, countInWindow, banLevel };
  }

  // 当前封禁时长： BASE * 2^banLevel，不超过 MAX
  const currentBanSec = Math.min(MAX_BAN_SEC, BASE_BAN_SEC * Math.pow(2, banLevel));

  // 最近一次失败时间
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

function recordFailure(username, ip) {
  db.prepare(
    `INSERT INTO login_failures (username, ip, failed_at) VALUES (?, ?, ?)`
  ).run(username, ip, Math.floor(Date.now() / 1000));
}

function clearFailures(username) {
  db.prepare(`DELETE FROM login_failures WHERE username = ?`).run(username);
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

    // 先查封禁（即使账号不存在，对同一个 username 也限流，避免枚举）
    const ban = getBanState(username);
    if (ban.banned) {
      // 封禁中：不再记录失败，避免每轮请求都再次延迟解禁
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
      recordFailure(username, ip);
      const after = getBanState(username);
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
      recordFailure(username, ip);
      const after = getBanState(username);
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

    // 成功登录 → 清理失败记录
    clearFailures(username);

    const { cookieOptions } = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(cookieOptions);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
