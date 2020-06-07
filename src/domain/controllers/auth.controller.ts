import {
  Controller,
  Post,
  Body,
  HttpCode,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginBruteforceProtectionInterceptor } from '../interceptors/login-bruteforce-protection.interceptor';
import { AuthService, AuthServiceErrors } from '../services/auth.service';
import {
  JwtDto,
  SignupDto,
  LoginDto,
  LoginTwoFaDto,
  VerifyEmailDto,
} from '../dto/auth.dto';

@ApiTags('Auth')
@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(200)
  async signup(@Body() body: SignupDto): Promise<JwtDto> {
    try {
      const jwt = await this.authService.signup(body);
      return { jwt };
    } catch (e) {
      if (e.name === AuthServiceErrors.UserAlreadyExists) {
        throw new ConflictException('User already Exists');
      }
      if (e.name === AuthServiceErrors.WeakPassword) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Post('login')
  //@UseInterceptors(LoginBruteforceProtectionInterceptor)
  @HttpCode(200)
  async login(@Body() body: LoginDto): Promise<JwtDto> {
    try {
      const jwt = await this.authService.login(body);
      return { jwt };
    } catch (e) {
      if (e.name === AuthServiceErrors.InvalidEmailOrPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw e;
    }
  }

  @Post('loginTwoFa')
  //@UseInterceptors(LoginBruteforceProtectionInterceptor)
  @HttpCode(200)
  async loginTwoFa(@Body() body: LoginTwoFaDto): Promise<JwtDto> {
    try {
      const jwt = await this.authService.loginTwoFa(body);
      return { jwt };
    } catch (e) {
      if (
        e.name === AuthServiceErrors.InvalidEmailOrPasswordOrVerificationCode
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
      await this.authService.verifyEmail(data);
    } catch (e) {
      if (e.name === AuthServiceErrors.CouldNotVerifyEmail) {
        throw new BadRequestException('Could not verify email address');
      }
      throw e;
    }
  }
}
