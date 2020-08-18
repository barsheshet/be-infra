import {
  Controller,
  UseGuards,
  Get,
  Query,
  NotFoundException,
  Body,
  Post,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { AuthGuard } from '../guards/auth.guard';
import { AclGuard } from '../guards/acl.guard';
import { AdminService } from '../services/admin.service';
import { AccountServiceErrors } from '../services/account.service';
import {
  GetUsersListDto,
  UsersListDto,
  UserExtendedDto,
  UserIdDto,
} from '../dto/admin.dto';

@ApiTags('Admin')
@Controller('/api/v1/admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, AclGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('get-users-list')
  getUsersList(@Query() options: GetUsersListDto): Promise<UsersListDto> {
    return this.adminService.getUsersList(options);
  }

  @Get('get-user-details')
  async getUserDetails(
    @Query() { userId }: UserIdDto,
  ): Promise<UserExtendedDto> {
    try {
      const user = await this.adminService.getUserDetails(userId);
      return user;
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('block-user')
  @HttpCode(200)
  async blockUser(@Body()  { userId }: UserIdDto): Promise<void> {
    try {
      await this.adminService.blockUser(userId);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('unblock-user')
  @HttpCode(200)
  async unBlockUser(@Body() { userId }: UserIdDto): Promise<void> {
    try {
      await this.adminService.unBlockUser(userId);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }
}
