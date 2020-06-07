import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsMobilePhone,
  MaxLength,
  IsEmail,
  IsLowercase,
  IsBoolean,
} from 'class-validator';

export class UserInfoDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

export class UpdateUserInfoDto extends UserInfoDto {}

export class UserDto {
  id: string;
  email: string;
  mobile: string;
  isSmsTwoFa: boolean;
  info: UserInfoDto;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  created: string;
  updated: string;
  deleted: string;
}

export class SetMobileDto {
  @IsString()
  @IsNotEmpty()
  @IsMobilePhone()
  mobile: string;
}

export class VerifyMobilelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  verificationCode: string;
}

export class SetEmailDto {
  @IsNotEmpty()
  @MaxLength(50)
  @IsEmail()
  @IsLowercase()
  email: string;
}

export class SetSmsTwoFaDto {
  @IsBoolean()
  smsTwoFa: boolean;
}
