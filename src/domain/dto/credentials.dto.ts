import { IsNotEmpty, IsEmail, IsLowercase, MaxLength } from 'class-validator';

export class CredentialsDto {
  @IsNotEmpty()
  @IsEmail()
  @IsLowercase()
  email: string;

  @IsNotEmpty()
  @MaxLength(20)
  password: string;
}
