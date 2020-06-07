import {
  Controller,
  UseGuards,
  Get,
  Post,
  HttpCode,
  Req,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UsersServiceErrors } from '../services/users.service';
import { AuthGuard } from '../guards/auth.guard';
import {
  UserDto,
  UserInfoDto,
  SetMobileDto,
  VerifyMobilelDto,
  SetEmailDto,
  SetSmsTwoFaDto,
} from '../dto/users.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('/api/v1/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req): Promise<UserDto> {
    try {
      const user = await this.usersService.me(req.userId);
      return user;
    } catch (e) {
      if (e.name === UsersServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('updateInfo')
  @HttpCode(200)
  async updateInfo(@Req() req, @Body() body: UserInfoDto): Promise<void> {
    try {
      await this.usersService.updateUserInfo(req.userId, body);
    } catch (e) {
      if (e.name === UsersServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('setMobile')
  @HttpCode(200)
  async setMobile(@Req() req, @Body() body: SetMobileDto): Promise<void> {
    await this.usersService.setMobile(req.userId, body);
  }

  @Post('verifyMobile')
  @HttpCode(200)
  async verifyMobile(
    @Req() req,
    @Body() body: VerifyMobilelDto,
  ): Promise<void> {
    try {
      await this.usersService.verifyMobile(req.userId, body);
    } catch (e) {
      if (e.name === UsersServiceErrors.CouldNotVerifyMobile) {
        throw new BadRequestException('Could not verify Mobile phone');
      }
      throw e;
    }
  }

  @Post('setEmail')
  @HttpCode(200)
  async setEmail(@Req() req, @Body() body: SetEmailDto): Promise<void> {
    try {
      await this.usersService.setEmail(req.userId, body);
    } catch (e) {
      if (e.name === UsersServiceErrors.UserAlreadyExists) {
        throw new BadRequestException('A user with this email already exists');
      }
      throw e;
    }
  }

  @Post('setSmsTwoFa')
  @HttpCode(200)
  async setSmsTwoFa(@Req() req, @Body() body: SetSmsTwoFaDto): Promise<void> {
    try {
      await this.usersService.setSmsTwoFa(req.userId, body);
    } catch (e) {
      if (e.name === UsersServiceErrors.MobileMustBeVerified) {
        throw new BadRequestException(
          'Must set and verify mobile phone to turn on 2 factor auth',
        );
      }
      throw e;
    }
  }
}
