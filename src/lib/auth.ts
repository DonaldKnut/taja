import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUser } from '@/models/User';

// JWT configuration - values read from env at runtime

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  // @ts-ignore - jsonwebtoken types are strict but this works at runtime
  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

export function generateRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret === 'your-refresh-secret-key-change-in-production') {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
  // @ts-ignore - jsonwebtoken types are strict but this works at runtime
  return jwt.sign(payload, secret, {
    expiresIn,
  });
}

export function verifyToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET is not configured');
  }
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret === 'your-refresh-secret-key-change-in-production') {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

