import {
  Controller,
  Get,
  Req,
  UseGuards,
  Body,
  Post,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CommandResponse, CommandStatus } from '../dto/command-response.dto';
import { UserDto } from '../dto/user.dto';
import { UserInfoDto } from '../dto/user-info.dto';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Users')
@Controller('/api/v1/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('getMyProfile')
  getMyProfile(@Req() req): UserDto {
    const user = new UserDto(req.user);
    return user;
  }

  @Post('updateInfo')
  @HttpCode(200)
  async updateInfo(
    @Req() req,
    @Body() info: UserInfoDto,
  ): Promise<CommandResponse> {
    await this.usersService.updateUserInfo(req.user.id, info);
    const response = new CommandResponse();
    response.status = CommandStatus.Complete;
    return response;
  }
}
