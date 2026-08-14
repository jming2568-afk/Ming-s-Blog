/** 内存滑动窗口限流器（单容器场景够用；多实例需换 Redis/DB 方案） */
interface Bucket {
  windowStart: number;
  count: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  /** 尝试通过：true=放行，false=超过限额 */
  allow(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      this.buckets.set(key, { windowStart: now, count: 1 });
      return true;
    }
    if (bucket.count >= this.max) return false;
    bucket.count += 1;
    return true;
  }

  /** 清理过期桶，防内存泄漏（可定时调用） */
  sweep(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStart >= this.windowMs) this.buckets.delete(key);
    }
  }
}
