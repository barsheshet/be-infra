import {
  IsNotEmpty,
  IsEmail,
  IsLowercase,
  MaxLength,
  IsString,
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

export class SignupDto extends CredentialsDto {}

export class LoginDto extends CredentialsDto {}

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
