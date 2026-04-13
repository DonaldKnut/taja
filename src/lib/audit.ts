import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function writeAuditLog(input: {
  request?: NextRequest;
  actorUserId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  success?: boolean;
  message?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await connectDB();
    const request = input.request;
    const forwardedFor = request?.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown-ip";
    const userAgent = request?.headers.get("user-agent") || "unknown-ua";

    await AuditLog.create({
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      route: request?.nextUrl?.pathname,
      method: request?.method,
      ip,
      userAgent,
      success: input.success !== false,
      message: input.message,
      metadata: input.metadata || {},
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}

