import {
  Controller,
  Post,
  Body,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  Get,
  Req,
  Res,
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
import { AclGuard } from '../guards/acl.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Account')
@Controller('/api/v1/account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly configService: ConfigService
  ) {}

  @Post('signup')
  @UseInterceptors(BruteforceInterceptor)
  @HttpCode(200)
  async signup(@Body() body: CredentialsDto, @Res() res): Promise<JwtDto> {
    try {
      const authResult = await this.accountService.signup(body);

      res.setCookie('refreshToken', authResult.refreshToken, {
        ...this.configService.get('refreshTokenCookieOptions'),
      });

      return { jwt: authResult.jwt };
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
  async login(@Body() body: CredentialsDto, @Res() res): Promise<JwtDto> {
    try {
      const authResult = await this.accountService.login(body);
      res.setCookie('refreshToken', authResult.refreshToken, {
        ...this.configService.get('refreshTokenCookieOptions'),
      });
      return { jwt: authResult.jwt };
    } catch (e) {
      if (e.name === AccountServiceErrors.InvalidEmailOrPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw e;
    }
  }

  @Post('login-two-fa')
  @UseInterceptors(BruteforceInterceptor)
  @HttpCode(200)
  async loginTwoFa(@Body() body: LoginTwoFaDto, @Res() res): Promise<JwtDto> {
    try {
      const authResult = await this.accountService.loginTwoFa(body);

      res.setCookie('refreshToken', authResult.refreshToken, {
        ...this.configService.get('refreshTokenCookieOptions'),
      });

      return { jwt: authResult.jwt };
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

  @Get('refresh-token')
  @HttpCode(200)
  async refreshToken(@Req() req, @Res() res): Promise<JwtDto> {
    try {
      const authResult = await this.accountService.refreshToken(req.cookies?.refreshToken);

      res.setCookie('refreshToken', authResult.refreshToken, {
        ...this.configService.get('refreshTokenCookieOptions'),
      });

      return { jwt: authResult.jwt };
    } catch (e) {
      if (e.name === AccountServiceErrors.InvalidRefreshToken) {
        throw new BadRequestException('Invalid refresh token');
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
  async logout(@Req() req): Promise<void> {
    await this.accountService.logout(req.user.id);
  }

  @Get('get-profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, AclGuard)
  async getProfile(@Req() req): Promise<UserDto> {
    try {
      const user = await this.accountService.getProfile(req.user.id);
      return user;
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('set-info')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setInfo(@Req() req, @Body() body: UserInfoDto): Promise<void> {
    try {
      await this.accountService.setInfo(req.user.id, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserDoesNotExists) {
        throw new NotFoundException('User does not exists');
      }
      throw e;
    }
  }

  @Post('set-mobile')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setMobile(@Req() req, @Body() body: SetMobileDto): Promise<void> {
    await this.accountService.setMobile(req.user.id, body);
  }

  @Post('verify-mobile')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async verifyMobile(
    @Req() req,
    @Body() body: VerifyMobilelDto,
  ): Promise<void> {
    try {
      await this.accountService.verifyMobile(req.user.id, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.CouldNotVerifyMobile) {
        throw new BadRequestException('Could not verify Mobile phone');
      }
      throw e;
    }
  }

  @Post('set-email')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setEmail(@Req() req, @Body() body: SetEmailDto): Promise<void> {
    try {
      await this.accountService.setEmail(req.user.id, body);
    } catch (e) {
      if (e.name === AccountServiceErrors.UserAlreadyExists) {
        throw new BadRequestException('A user with this email already exists');
      }
      throw e;
    }
  }

  @Post('set-sms-two-fa')
  @ApiBearerAuth()
  @HttpCode(200)
  @UseGuards(AuthGuard, AclGuard)
  async setSmsTwoFa(@Req() req, @Body() body: SetSmsTwoFaDto): Promise<void> {
    try {
      await this.accountService.setSmsTwoFa(req.user.id, body);
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
