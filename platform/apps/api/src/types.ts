import type { ApiConfig } from "./config.js";
import type { PublicUser } from "./modules/auth/auth.service.js";

/** 全应用共享的 Hono 上下文变量 */
export interface AppVariables {
  config: ApiConfig;
  user: PublicUser | null;
}
