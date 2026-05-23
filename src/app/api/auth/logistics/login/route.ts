import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { comparePassword, generateToken, generateRefreshToken } from "@/lib/auth";
import { authRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Rider-only login (role logistics). Same cookie contract as /api/auth/login. */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "logistics") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This portal is for logistics riders only. Use the main sign-in for buyer or seller accounts.",
        },
        { status: 403 }
      );
    }

    const isLocked = user.lockUntil && user.lockUntil > new Date();
    if (isLocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is temporarily locked due to failed sign-in attempts. Try again later.",
        },
        { status: 423 }
      );
    }

    if (user.accountStatus !== "active") {
      return NextResponse.json(
        { success: false, message: `Account is ${user.accountStatus}. Contact support.` },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };
      if (user.loginAttempts + 1 >= 5) {
        (updates as any).$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) };
      }
      await User.findByIdAndUpdate(user._id, updates);
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const deviceId = request.headers.get("user-agent") || "unknown";
    user.refreshTokens.push({
      token: refreshToken,
      deviceId: deviceId.substring(0, 100),
      deviceInfo: deviceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };

    const nextResponse = NextResponse.json(
      {
        success: true,
        message: "Signed in",
        data: { token, refreshToken, user: userData },
      },
      { status: 200 }
    );

    const isSecure = request.nextUrl.protocol === "https:";
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    nextResponse.cookies.set("token", token, {
      path: "/",
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      maxAge,
    });

    return nextResponse;
  } catch (error: unknown) {
    console.error("Logistics login error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
