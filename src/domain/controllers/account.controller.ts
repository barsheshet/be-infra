import {
  Controller,
  Post,
  Body,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  UseInterceptors,
  Headers,
  UseGuards,
  NotFoundException,
  Get,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BruteforceInterceptor } from '../interceptors/bruteforce.interceptor';
import {
  AccountServiceErrors,
  AccountService,
} from '../services/account.service';
import {
  JwtDto,
  CredentialsDto,
  LoginTwoFaDto,
  VerifyEmailDto,
  UserDto,
  UserInfoDto,
  VerifyMobilelDto,
  SetMobileDto,
  SetEmailDto,
  SetSmsTwoFaDto,
} from '../dto/account.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Utils } from '../../lib/utils';
import { AclGuard } from '../guards/acl.guard';

@ApiTags('Account')
@Controller('/api/v1/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('signup')
  @UseInterceptors(BruteforceInterceptor)
  @HttpCode(200)
  async signup(@Body() body: CredentialsDto): Promise<JwtDto> {
    try {
      const jwt = await this.accountService.signup(body);
      return { jwt };
    } catch (e) {
      if (e.name === AccountServiceErrors.UserAlreadyExists) {
        throw new UnauthorizedException('User already Exists');
      }
      if (e.name === AccountServiceErrors.WeakPassword) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Post('login')
  @UseInterceptors(BruteforceInterceptor)
  @HttpCode(200)
  async login(@Body() body: CredentialsDto): Promise<JwtDto> {
    try {
      const jwt = await this.accountService.login(body);
      return { jwt };
    } catch (e) {
      if (e.name === AccountServiceErrors.InvalidEmailOrPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw e;
    }
  }

  @Post('loginTwoFa')
  @UseInterceptors(BruteforceInterceptor)
  @HttpCode(200)
  async loginTwoFa(@Body() body: LoginTwoFaDto): Promise<JwtDto> {
    try {
      const jwt = await this.accountService.loginTwoFa(body);
      return { jwt };
    } catch (e) {
      if (
        e.name === AccountServiceErrors.InvalidEmailOrPasswordOrVerificationCode
      ) {
        throw new UnauthorizedException(
          'Invalid email, password, or verification code',
        );
      }
      throw e;
    }
  }

  @Post('verifyEmail')
  @HttpCode(200)
  async verifyEmail(@Body() data: VerifyEmailDto): Promise<void> {
    try {
      await this.accountService.verifyEmail(data);
    } catch (e) {
      if (e.name === AccountServiceErrors.CouldNotVerifyEmail) {
        throw new BadRequestException('Could not verify email address');
      }
      throw e;
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async logout(
    @Headers() { authorization }: { authorization: string },
  ): Promise<void> {
    const jwt = Utils.parseAutorizationHeader(authorization);
    await this.accountService.logout({ jwt });
  }

  @Get('getProfile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, AclGuard)
  async getProfile(@Req() req): Promise<UserDto> {
    try {
      const user = await this.accountService.getProfile(req.userId);
      return user;
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('setInfo')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setInfo(@Req() req, @Body() body: UserInfoDto): Promise<void> {
    try {
      await this.accountService.setInfo(req.userId, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('setMobile')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setMobile(@Req() req, @Body() body: SetMobileDto): Promise<void> {
    await this.accountService.setMobile(req.userId, body);
  }

  @Post('verifyMobile')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async verifyMobile(
    @Req() req,
    @Body() body: VerifyMobilelDto,
  ): Promise<void> {
    try {
      await this.accountService.verifyMobile(req.userId, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.CouldNotVerifyMobile) {
        throw new BadRequestException('Could not verify Mobile phone');
      }
      throw e;
    }
  }

  @Post('setEmail')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setEmail(@Req() req, @Body() body: SetEmailDto): Promise<void> {
    try {
      await this.accountService.setEmail(req.userId, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserAlreadyExists) {
        throw new BadRequestException('A user with this email already exists');
      }
      throw e;
    }
  }

  @Post('setSmsTwoFa')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setSmsTwoFa(@Req() req, @Body() body: SetSmsTwoFaDto): Promise<void> {
    try {
      await this.accountService.setSmsTwoFa(req.userId, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.MobileMustBeVerified) {
        throw new BadRequestException(
          'Must set and verify mobile phone to turn on 2 factor auth',
        );
      }
      throw e;
    }
  }
}
