// lib/users.js — 管理员账号与登录失败限流（基于 Blob 文档存储）

import { getDoc, updateDoc } from "@/lib/store";
import { verifyPassword } from "@/lib/auth";

const FAIL_WINDOW_SEC = 5 * 60; // 5 分钟滑动窗口
const FAIL_THRESHOLD = 3; // 3 次失败触发封禁
const BASE_BAN_SEC = 5 * 60; // 首次封禁 5 分钟
const MAX_BAN_SEC = 2 * 60 * 60; // 封禁上限 2 小时
const RETENTION_SEC = 7 * 24 * 3600; // 失败记录保留 7 天

export async function getAdmin() {
  const doc = await getDoc();
  return doc.admin || null;
}

export async function findAdminByUserId(userId) {
  const admin = await getAdmin();
  return admin && Number(admin.id) === Number(userId) ? admin : null;
}

function countInWindow(failures, username, since) {
  return failures.filter((f) => f.username === username && f.failedAt >= since).length;
}

function lastFailedAt(failures, username, since) {
  const ts = failures
    .filter((f) => f.username === username && f.failedAt >= since)
    .map((f) => f.failedAt);
  return ts.length ? Math.max(...ts) : null;
}

export function formatSec(total) {
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

// 返回当前封禁状态（与旧 SQLite 实现行为一致）
export async function getBanState(username) {
  const doc = await getDoc();
  const now = Math.floor(Date.now() / 1000);
  const failures = doc.loginFailures || [];
  const windowStart = now - FAIL_WINDOW_SEC;

  const windowCount = countInWindow(failures, username, windowStart);
  const totalIn7d = countInWindow(failures, username, now - RETENTION_SEC);
  const banLevel = Math.max(0, Math.floor(totalIn7d / FAIL_THRESHOLD) - 1);

  if (windowCount < FAIL_THRESHOLD) {
    return { banned: false, countInWindow: windowCount, banLevel };
  }

  const currentBanSec = Math.min(MAX_BAN_SEC, BASE_BAN_SEC * Math.pow(2, banLevel));
  const last = lastFailedAt(failures, username, windowStart) || now;
  const banUntil = last + currentBanSec;
  const remain = banUntil - now;

  return {
    banned: remain > 0,
    remainSec: remain,
    remainText: formatSec(remain),
    countInWindow: windowCount,
    banLevel,
    currentBanSec,
  };
}

export async function recordFailure(username, ip) {
  await updateDoc((doc) => {
    const now = Math.floor(Date.now() / 1000);
    const failures = (doc.loginFailures || []).filter(
      (f) => now - f.failedAt < RETENTION_SEC
    );
    failures.push({ username, ip: ip || "", failedAt: now });
    doc.loginFailures = failures;
  });
}

export async function clearFailures(username) {
  await updateDoc((doc) => {
    doc.loginFailures = (doc.loginFailures || []).filter((f) => f.username !== username);
  });
}

export async function checkPassword(username, password) {
  const admin = await getAdmin();
  if (!admin || admin.username !== username) return false;
  return verifyPassword(password, admin.passwordHash);
}

export async function updateAdminPassword(userId, newHash) {
  await updateDoc((doc) => {
    if (doc.admin && Number(doc.admin.id) === Number(userId)) {
      doc.admin.passwordHash = newHash;
    }
  });
}
