import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformSettings extends Document {
  /**
   * Singleton document for global platform configuration.
   */
  referral?: {
    enabled: boolean;
    /**
     * Percentage of order total (in Naira) awarded as referral bonus.
     * Stored as a plain number, e.g. 2 = 2%.
     */
    bonusPercentage: number;
  };
  payments?: {
    /**
     * Percentage of order total (in Naira) kept by platform as revenue.
     * Stored as a plain number, e.g. 5 = 5%.
     */
    platformFeePercentage: number;
    /**
     * Number of days after delivery before escrow auto-release to seller.
     */
    autoReleaseDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    referral: {
      enabled: { type: Boolean, default: true },
      bonusPercentage: { type: Number, default: 2 },
    },
    payments: {
      platformFeePercentage: { type: Number, default: 5 },
      autoReleaseDays: { type: Number, default: 7 },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure we only ever have a tiny number of docs; most queries will just use findOne().
PlatformSettingsSchema.index({ createdAt: 1 });

const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

export default PlatformSettings;

