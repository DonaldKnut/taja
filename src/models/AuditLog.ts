import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorUserId?: mongoose.Types.ObjectId;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  route?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: String,
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    route: String,
    method: String,
    ip: String,
    userAgent: String,
    success: { type: Boolean, default: true },
    message: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;

