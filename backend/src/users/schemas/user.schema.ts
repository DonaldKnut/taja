import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  })
  email: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    default: undefined,
  })
  phone?: string;

  @Prop({
    required: false,
    minlength: 6,
    select: false,
  })
  password?: string;

  @Prop({ enum: ['buyer', 'seller', 'admin'], default: 'buyer' })
  role: 'buyer' | 'seller' | 'admin';

  @Prop()
  avatar?: string;

  @Prop()
  coverPhoto?: string;

  @Prop({
    type: String,
    enum: ['active', 'suspended', 'banned', 'under_review'],
    default: 'active',
  })
  accountStatus: 'active' | 'suspended' | 'banned' | 'under_review';

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop()
  emailVerificationCode?: string;

  @Prop()
  emailVerificationExpiry?: Date;

  @Prop()
  phoneVerificationCode?: string;

  @Prop()
  phoneVerificationExpiry?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpiry?: Date;

  @Prop({
    type: {
      google: {
        id: { type: String },
        email: { type: String },
        verified: { type: Boolean },
      },
    },
    default: {},
  })
  oauthProviders: {
    google?: {
      id: string;
      email: string;
      verified: boolean;
    };
  };

  @Prop({ unique: true, sparse: true, trim: true })
  referralCode?: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  referredBy?: Types.ObjectId;

  @Prop({
    type: {
      totalReferred: { type: Number, default: 0 },
      totalEarnedKobo: { type: Number, default: 0 },
    },
    default: {},
  })
  referralStats?: {
    totalReferred: number;
    totalEarnedKobo: number;
  };

  @Prop({ type: Number, default: 0 })
  points?: number;

  @Prop({
    type: [
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
    default: [],
  })
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

  @Prop({
    type: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
    default: {},
  })
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };

  @Prop({
    type: [
      {
        token: String,
        deviceId: String,
        deviceInfo: String,
        expiresAt: Date,
      },
    ],
    default: [],
  })
  refreshTokens: Array<{
    token: string;
    deviceId: string;
    deviceInfo: string;
    expiresAt: Date;
  }>;

  @Prop({
    type: {
      duplicatePhone: { type: Boolean },
      suspiciousEmail: { type: Boolean },
      multipleAccounts: { type: Boolean },
    },
    default: {},
  })
  fraudFlags: {
    duplicatePhone?: boolean;
    suspiciousEmail?: boolean;
    multipleAccounts?: boolean;
  };

  @Prop({ default: false })
  roleSelected?: boolean;

  @Prop()
  roleSelectionDate?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ 'oauthProviders.google.id': 1 });
UserSchema.index({ referredBy: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('referralCode') && this.referralCode) {
    next();
    return;
  }

  if (!this.referralCode) {
    this.referralCode = Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase();
  }

  next();
});
