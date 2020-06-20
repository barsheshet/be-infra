import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { AuthGuard } from '../guards/auth.guard';
import { AclGuard } from '../guards/acl.guard';
import { AdminService } from '../services/admin.service';
import { GetUsersListDto, UsersListDto } from '../dto/admin.dto';

@ApiTags('Admin')
@Controller('/api/v1/admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, AclGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('getUsersList')
  getUsersList(@Query() options: GetUsersListDto): Promise<UsersListDto> {
    return this.adminService.getUsersList(options);
  }
}
