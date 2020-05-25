import { IsString, IsOptional } from 'class-validator';

export class UserInfoDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
