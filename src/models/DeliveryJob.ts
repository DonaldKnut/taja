import mongoose, { Document, Model, Schema } from "mongoose";

export type DeliveryJobStatus =
  | "open"
  | "reserved"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "disputed";

export interface IDeliveryJob extends Document {
  order: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  shop?: mongoose.Types.ObjectId;
  rider?: mongoose.Types.ObjectId;
  status: DeliveryJobStatus;
  valueKobo: number;
  deliveryFeeKobo: number;
  pickup: {
    state: string;
    city: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  dropoff: {
    state: string;
    city: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  broadcast: {
    radiusKm: number;
    expiresAt: Date;
    invitedRiderIds?: mongoose.Types.ObjectId[];
  };
  claim?: {
    claimedAt?: Date;
    claimExpiresAt?: Date;
  };
  otp: {
    pickupCodeHash: string;
    deliveryCodeHash: string;
    pickupVerifiedAt?: Date;
    deliveryVerifiedAt?: Date;
  };
  proof: {
    pickupPhotos: string[];
    deliveryPhotos: string[];
  };
  telemetry: Array<{
    lat: number;
    lng: number;
    speedKmh?: number;
    capturedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryJobSchema = new Schema<IDeliveryJob>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop" },
    rider: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: ["open", "reserved", "picked_up", "delivered", "cancelled", "disputed"],
      default: "open",
      index: true,
    },
    valueKobo: { type: Number, required: true, min: 1 },
    deliveryFeeKobo: { type: Number, default: 0, min: 0 },
    pickup: {
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true, index: true },
      address: { type: String, required: true, trim: true },
      lat: Number,
      lng: Number,
    },
    dropoff: {
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      lat: Number,
      lng: Number,
    },
    broadcast: {
      radiusKm: { type: Number, default: 10, min: 1 },
      expiresAt: { type: Date, required: true, index: true },
      invitedRiderIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    claim: {
      claimedAt: Date,
      claimExpiresAt: Date,
    },
    otp: {
      pickupCodeHash: { type: String, required: true, select: false },
      deliveryCodeHash: { type: String, required: true, select: false },
      pickupVerifiedAt: Date,
      deliveryVerifiedAt: Date,
    },
    proof: {
      pickupPhotos: [{ type: String, trim: true }],
      deliveryPhotos: [{ type: String, trim: true }],
    },
    telemetry: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        speedKmh: Number,
        capturedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

DeliveryJobSchema.index({ status: 1, "pickup.city": 1, "pickup.state": 1, "broadcast.expiresAt": 1 });
DeliveryJobSchema.index({ rider: 1, status: 1 });

const DeliveryJob: Model<IDeliveryJob> =
  mongoose.models.DeliveryJob || mongoose.model<IDeliveryJob>("DeliveryJob", DeliveryJobSchema);

export default DeliveryJob;
