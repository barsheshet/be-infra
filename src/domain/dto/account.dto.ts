import {
  IsNotEmpty,
  IsEmail,
  IsLowercase,
  MaxLength,
  IsString,
  IsOptional,
  IsMobilePhone,
  IsBoolean,
} from 'class-validator';

export class CredentialsDto {
  @IsNotEmpty()
  @MaxLength(50)
  @IsEmail()
  @IsLowercase()
  email: string;

  @IsNotEmpty()
  @MaxLength(20)
  password: string;
}

export class LoginTwoFaDto extends CredentialsDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  verificaitonCode: string;
}

export class JwtDto {
  jwt: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  token: string;
}

export class UserInfoDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

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
