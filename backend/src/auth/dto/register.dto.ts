import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: 'buyer' | 'seller';

  @IsOptional()
  @IsString()
  referralCode?: string;
}
