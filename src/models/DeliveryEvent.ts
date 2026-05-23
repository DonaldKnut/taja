import mongoose, { Document, Model, Schema } from "mongoose";

export type DeliveryEventType =
  | "broadcast_created"
  | "job_claimed"
  | "job_reassigned"
  | "claim_timeout_requeued"
  | "broadcast_expired_cancelled"
  | "pickup_otp_verified"
  | "delivery_otp_verified"
  | "pickup_proof_uploaded"
  | "delivery_proof_uploaded";

export interface IDeliveryEvent extends Document {
  job: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId;
  actorRole: "admin" | "logistics" | "system" | "seller";
  eventType: DeliveryEventType;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryEventSchema = new Schema<IDeliveryEvent>(
  {
    job: { type: Schema.Types.ObjectId, ref: "DeliveryJob", required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: {
      type: String,
      enum: ["admin", "logistics", "system", "seller"],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "broadcast_created",
        "job_claimed",
        "job_reassigned",
        "claim_timeout_requeued",
        "broadcast_expired_cancelled",
        "pickup_otp_verified",
        "delivery_otp_verified",
        "pickup_proof_uploaded",
        "delivery_proof_uploaded",
      ],
      required: true,
      index: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

DeliveryEventSchema.index({ job: 1, createdAt: -1 });

const DeliveryEvent: Model<IDeliveryEvent> =
  mongoose.models.DeliveryEvent ||
  mongoose.model<IDeliveryEvent>("DeliveryEvent", DeliveryEventSchema);

export default DeliveryEvent;
