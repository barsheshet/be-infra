import {
  IsNotEmpty,
  IsEmail,
  IsLowercase,
  MaxLength,
} from 'class-validator';


export enum CommandStatus {
  Complete = 'Complete',
  Failed = 'Failed',
}

export class Jwt {
  jwt: string;
}

export class CredentialsDto {
  @IsNotEmpty()
  @IsEmail()
  @IsLowercase()
  email: string;

  @IsNotEmpty()
  @MaxLength(20)
  password: string;
}

export class CommandResponse {
  status: CommandStatus;
}

export class SignUpResponse extends CommandResponse {
  data: Jwt;
}

export class LoginResponse extends CommandResponse {
  data: Jwt;
} 