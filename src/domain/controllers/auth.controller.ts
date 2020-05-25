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
import { JwtService } from '@nestjs/jwt';
import { UsersService, UsersServiceErrors } from '../services/users.service';
import { User } from '../entities/user.entity';
import { LoginBruteforceProtectionInterceptor } from '../interceptors/login-bruteforce-protection.interceptor';
import { CredentialsDto } from '../dto/credentials.dto';
import {
  LoginResponse,
  SignUpResponse,
  CommandStatus,
} from '../dto/command-response.dto';

@ApiTags('Auth')
@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  @HttpCode(200)
  async signup(@Body() creds: CredentialsDto): Promise<SignUpResponse> {
    try {
      const user: User = await this.usersService.register(creds);
      const jwt: string = await this.jwtService.signAsync({ sub: user.id });
      const response = new SignUpResponse();
      response.status = CommandStatus.Complete;
      response.data = { jwt };
      return response;
    } catch (e) {
      if (e.name === UsersServiceErrors.UserAlreadyExists) {
        throw new ConflictException('User already Exists');
      }
      if (e.name === UsersServiceErrors.WeakPassword) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Post('login')
  @UseInterceptors(LoginBruteforceProtectionInterceptor)
  @HttpCode(200)
  async login(@Body() creds: CredentialsDto): Promise<LoginResponse> {
    try {
      const user: User = await this.usersService.verifyCredentials(creds);
      const jwt: string = await this.jwtService.signAsync({ sub: user.id });
      const response = new LoginResponse();
      response.status = CommandStatus.Complete;
      response.data = { jwt };
      return response;
    } catch (e) {
      if (e.name === UsersServiceErrors.InvalidEmailOrPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw e;
    }
  }
}
