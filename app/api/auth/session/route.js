import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findAdminByUserId } from "@/lib/users";
import { normalizeError, json500 } from "@/lib/routeHelpers";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ isLoggedIn: false });
    }
    const user = await findAdminByUserId(session.userId);
    if (!user) {
      return NextResponse.json({ isLoggedIn: false });
    }
    return NextResponse.json({
      isLoggedIn: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    const { message, stack } = normalizeError(err);
    console.error("[auth/session] error:", err);
    return NextResponse.json(
      {
        isLoggedIn: false,
        error: message,
        debug: IS_DEV ? message : undefined,
        stack: IS_DEV && stack ? stack.split("\n").slice(0, 8).join("\n") : undefined,
      },
      { status: 500 }
    );
  }
}
