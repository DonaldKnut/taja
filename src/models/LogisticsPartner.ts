import mongoose, { Document, Model, Schema } from "mongoose";

export type LogisticsVehicleType =
  | "bicycle"
  | "motorcycle"
  | "car"
  | "van"
  | "truck";

export type LogisticsKycStatus =
  | "pending"
  | "verified"
  | "rejected";

export type LogisticsPartnerStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended";

export interface ILogisticsPartner extends Document {
  user?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: LogisticsVehicleType;
  canHandleFragile: boolean;
  notes?: string;
  coverage: {
    state: string;
    city: string;
    areas: string[];
  };
  availability: {
    isOnline: boolean;
    activeHours?: string;
  };
  trust: {
    kycStatus: LogisticsKycStatus;
    idType?: "national_id" | "drivers_license" | "passport" | "voters_card";
    idNumberMasked?: string;
    selfieImage?: string;
    idFrontImage?: string;
    guarantorPhone?: string;
  };
  verification: {
    emailOtp?: {
      codeHash?: string;
      expiresAt?: Date;
      verifiedAt?: Date;
      lastSentAt?: Date;
      attempts?: number;
    };
  };
  risk: {
    level: "normal" | "watchlist" | "blacklist";
    reasonCode?:
      | "id_mismatch"
      | "suspicious_activity"
      | "failed_delivery_pattern"
      | "stolen_package_report"
      | "duplicate_identity"
      | "other";
    reasonNotes?: string;
  };
  payout: {
    holdDays: number;
    holdUntil?: Date;
  };
  status: LogisticsPartnerStatus;
  assignment: {
    totalAssigned: number;
    totalCompleted: number;
    totalCancelled: number;
    averageRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LogisticsPartnerSchema = new Schema<ILogisticsPartner>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    vehicleType: {
      type: String,
      enum: ["bicycle", "motorcycle", "car", "van", "truck"],
      required: true,
    },
    canHandleFragile: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    coverage: {
      state: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      areas: [{ type: String, trim: true }],
    },
    availability: {
      isOnline: { type: Boolean, default: false },
      activeHours: { type: String, trim: true },
    },
    trust: {
      kycStatus: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      idType: {
        type: String,
        enum: ["national_id", "drivers_license", "passport", "voters_card"],
      },
      idNumberMasked: { type: String, trim: true },
      selfieImage: { type: String, trim: true },
      idFrontImage: { type: String, trim: true },
      guarantorPhone: { type: String, trim: true },
    },
    verification: {
      emailOtp: {
        codeHash: { type: String, select: false },
        expiresAt: Date,
        verifiedAt: Date,
        lastSentAt: Date,
        attempts: { type: Number, default: 0 },
      },
    },
    risk: {
      level: {
        type: String,
        enum: ["normal", "watchlist", "blacklist"],
        default: "normal",
      },
      reasonCode: {
        type: String,
        enum: [
          "id_mismatch",
          "suspicious_activity",
          "failed_delivery_pattern",
          "stolen_package_report",
          "duplicate_identity",
          "other",
        ],
      },
      reasonNotes: { type: String, trim: true },
    },
    payout: {
      holdDays: { type: Number, default: 14 },
      holdUntil: Date,
    },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected", "suspended"],
      default: "pending_review",
      index: true,
    },
    assignment: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      totalCancelled: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

LogisticsPartnerSchema.index({ email: 1, phone: 1 }, { unique: true });
LogisticsPartnerSchema.index({ "coverage.state": 1, "coverage.city": 1, status: 1 });
LogisticsPartnerSchema.index({ "risk.level": 1, status: 1 });

const LogisticsPartner: Model<ILogisticsPartner> =
  mongoose.models.LogisticsPartner ||
  mongoose.model<ILogisticsPartner>("LogisticsPartner", LogisticsPartnerSchema);

export default LogisticsPartner;
