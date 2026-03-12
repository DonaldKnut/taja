import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshTokens -emailVerificationCode -phoneVerificationCode');

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone.trim();
    }

    if (dto.avatar !== undefined) {
      user.avatar = dto.avatar;
    }

    if (dto.coverPhoto !== undefined) {
      user.coverPhoto = dto.coverPhoto;
    }

    if (dto.role) {
      user.role = dto.role;
      user.roleSelected = true;
      user.roleSelectionDate = new Date();
    }

    if (dto.preferences) {
      user.preferences = {
        ...user.preferences,
        ...dto.preferences,
      };
    }

    await user.save();

    return {
      message: 'Profile updated successfully.',
      data: {
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
      },
    };
  }
}
