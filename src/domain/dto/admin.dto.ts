import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserDto as User } from './account.dto';

export type UserDto = User;

export enum OrderByDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum OrderBy {
  email = 'email',
  mobile = 'mobile',
  isSmsTwoFa = 'isSmsTwoFa',
  isEmailVerified = 'isEmailVerified',
  isMobileVerified = 'isMobileVerified',
  created = 'created',
  updated = 'updated',
  firstName = 'firstName',
  lastName = 'lastName',
}

export class GetUsersListDto {
  @IsOptional()
  @Transform(value => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(value => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 50;

  @IsOptional()
  @IsIn(Object.values(OrderBy))
  orderBy?: OrderBy = OrderBy.created;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(OrderByDirection))
  orderByDirection?: OrderByDirection = OrderByDirection.ASC;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  searchTerm?: string;
}

export class UsersListDto {
  page: number;
  totalPages: number;
  totalItems: number;
  users: UserDto[];
}
