import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string; // optional for OAuth users; required for email sign-up
  password: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  referralStats?: {
    totalReferred: number;
    totalEarnedKobo: number;
  };
  /** Reward points earned from purchases (e.g. 1 point per ₦100 spent, awarded on delivery) */
  points?: number;
  accountStatus: 'active' | 'suspended' | 'banned' | 'under_review';
  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiry?: Date;
  phoneVerificationCode?: string;
  phoneVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  oauthProviders: {
    google?: {
      id: string;
      email: string;
      verified: boolean;
    };
  };
  addresses: Array<{
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    isDefault: boolean;
  }>;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  refreshTokens: Array<{
    token: string;
    deviceId: string;
    deviceInfo: string;
    expiresAt: Date;
  }>;
  fraudFlags: {
    duplicatePhone?: boolean;
    suspiciousEmail?: boolean;
    multipleAccounts?: boolean;
  };
  kyc?: {
    status?: 'pending' | 'approved' | 'rejected' | 'not_started';
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: any;
    rejectionReason?: string;
    businessName?: string;
    businessType?: 'individual' | 'registered_business' | 'cooperative';
    businessRegistrationNumber?: string;
    taxId?: string;
    idType?: 'national_id' | 'drivers_license' | 'passport' | 'voters_card';
    idNumber?: string;
    idFrontImage?: string;
    idBackImage?: string;
    selfieImage?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankVerificationNumber?: string;
    businessAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    utilityBill?: string;
    businessLicense?: string;
    phoneVerifiedForKyc?: boolean;
    phoneVerificationCode?: string;
    phoneVerificationExpiry?: Date;
    identityVerified?: boolean;
    identityVerificationData?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      dateOfBirth?: string;
      gender?: string;
      phoneNumber?: string;
      address?: string;
      photo?: string;
    };
    identityVerificationError?: string;
    identityVerificationProvider?: string;
  };
  roleSelected?: boolean;
  roleSelectionDate?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockUntil?: Date;
  isLocked?: boolean; // Virtual property
  incLoginAttempts(): Promise<any>;
  resetLoginAttempts(): Promise<any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: false, // Not required for OAuth users; validated in registration route for email sign-up
      unique: true,
      sparse: true, // allow multiple users with no phone (e.g. OAuth-only)
      trim: true,
      default: undefined,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.oauthProviders?.google;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
    avatar: String,
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'under_review'],
      default: 'active',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: String,
    emailVerificationExpiry: Date,
    phoneVerificationCode: String,
    phoneVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    oauthProviders: {
      google: {
        id: String,
        email: String,
        verified: Boolean,
      },
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referralStats: {
      totalReferred: { type: Number, default: 0 },
      totalEarnedKobo: { type: Number, default: 0 },
    },
    points: { type: Number, default: 0 },
    addresses: [
      {
        fullName: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'Nigeria' },
        isDefault: { type: Boolean, default: false },
      },
    ],
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
    refreshTokens: [
      {
        token: String,
        deviceId: String,
        deviceInfo: String,
        expiresAt: Date,
      },
    ],
    fraudFlags: {
      duplicatePhone: Boolean,
      suspiciousEmail: Boolean,
      multipleAccounts: Boolean,
    },
    kyc: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_started'],
        default: 'not_started',
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
      businessName: String,
      businessType: {
        type: String,
        enum: ['individual', 'registered_business', 'cooperative'],
      },
      businessRegistrationNumber: String,
      taxId: String,
      idType: {
        type: String,
        enum: ['national_id', 'drivers_license', 'passport', 'voters_card'],
      },
      idNumber: String,
      idFrontImage: String,
      idBackImage: String,
      selfieImage: String,
      bankName: String,
      accountNumber: String,
      accountName: String,
      bankVerificationNumber: String,
      businessAddress: {
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: { type: String, default: 'Nigeria' },
      },
      utilityBill: String,
      businessLicense: String,
      phoneVerifiedForKyc: Boolean,
      phoneVerificationCode: String,
      phoneVerificationExpiry: Date,
      identityVerified: Boolean,
      identityVerificationData: {
        firstName: String,
        lastName: String,
        fullName: String,
        dateOfBirth: String,
        gender: String,
        phoneNumber: String,
        address: String,
        photo: String,
      },
      identityVerificationError: String,
      identityVerificationProvider: String,
    },
    roleSelected: {
      type: Boolean,
      default: false,
    },
    roleSelectionDate: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: email and phone already have indexes from unique: true in schema definition
// Only add explicit indexes for fields that don't have unique constraint
UserSchema.index({ 'oauthProviders.google.id': 1 });
UserSchema.index({ referredBy: 1 });

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function (this: IUser) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates: any = { $inc: { loginAttempts: 1 } };
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function (this: IUser) {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Generate referral code for new users
UserSchema.pre('save', async function (next) {
  try {
    if (!this.referralCode) {
      const model = this.model('User');
      let code = '';
      for (let i = 0; i < 10; i++) {
        code = Math.random().toString(36).slice(2, 10).toUpperCase();
        const exists = await model.exists({ referralCode: code });
        if (!exists) break;
      }
      this.referralCode = code;
    }
    next();
  } catch (e) {
    next(e as any);
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

