import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiry(minutes = 10): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private signAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      },
    );
  }

  private signRefreshToken(user: UserDocument): string {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      },
    );
  }

  private getSafeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      preferences: user.preferences,
      roleSelected: user.roleSelected,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const phone = dto.phone?.trim();

    const [existingEmail, existingPhone] = await Promise.all([
      this.userModel.exists({ email }),
      phone ? this.userModel.exists({ phone }) : null,
    ]);

    if (existingEmail) {
      throw new BadRequestException('An account with this email already exists.');
    }

    if (existingPhone) {
      throw new BadRequestException('An account with this phone already exists.');
    }

    const emailVerificationCode = this.generateOtp();
    const hashedPassword = await this.hashPassword(dto.password);

    const user = await this.userModel.create({
      fullName: dto.fullName.trim(),
      email,
      phone,
      password: hashedPassword,
      role: dto.role || 'buyer',
      roleSelected: true,
      roleSelectionDate: new Date(),
      emailVerificationCode,
      emailVerificationExpiry: this.getOtpExpiry(10),
      accountStatus: 'active',
    });

    return {
      message: 'Registration successful. Please verify your email.',
      data: {
        userId: user._id.toString(),
        email: user.email,
        emailSent: false,
        otpCode:
          process.env.NODE_ENV === 'production' ? undefined : emailVerificationCode,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (
      user.emailVerificationCode !== dto.code ||
      !user.emailVerificationExpiry ||
      user.emailVerificationExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return {
      message: 'Email verified successfully.',
      data: {
        user: this.getSafeUser(user),
      },
    };
  }

  async login(dto: LoginDto, userAgent: string, ipAddress: string) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userModel
      .findOne({ email })
      .select('+password +loginAttempts +lockUntil');

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isLocked = !!(user.lockUntil && user.lockUntil > new Date());
    if (isLocked) {
      throw new ForbiddenException(
        'Account is temporarily locked due to failed login attempts.',
      );
    }

    const isPasswordValid = await this.comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      const nextAttempts = (user.loginAttempts || 0) + 1;
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: nextAttempts >= 5 ? { lockUntil: new Date(Date.now() + 30 * 60 * 1000) } : {},
        $inc: { loginAttempts: 1 },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.accountStatus !== 'active') {
      throw new ForbiddenException(
        `Account is ${user.accountStatus}. Please contact support.`,
      );
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    user.refreshTokens.push({
      token: refreshToken,
      deviceId: userAgent.slice(0, 100) || 'unknown',
      deviceInfo: userAgent || 'unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    return {
      message: 'Login successful.',
      data: {
        accessToken,
        refreshToken,
        user: this.getSafeUser(user),
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
      }>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const tokenIndex = user.refreshTokens.findIndex(
        (entry) => entry.token === dto.refreshToken,
      );

      if (tokenIndex === -1) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const accessToken = this.signAccessToken(user);
      const refreshToken = this.signRefreshToken(user);

      user.refreshTokens[tokenIndex].token = refreshToken;
      user.refreshTokens[tokenIndex].expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );
      await user.save();

      return {
        message: 'Token refreshed successfully.',
        data: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }
}
