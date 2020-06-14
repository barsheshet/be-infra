import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository, Connection } from 'typeorm';
import {
  LoginDto,
  SignupDto,
  LoginTwoFaDto,
  VerifyEmailDto,
  JwtDto,
} from '../dto/auth.dto';
import { test as testPassword } from 'owasp-password-strength-test';
import { JwtService } from '@nestjs/jwt';
import { ServiceError } from '../../lib/service-error';
import { VerificationsService } from './verifications.service';
import { RedisProvider } from '../providers/redis.provider';

export enum AuthServiceErrors {
  UserAlreadyExists = 'UserAlreadyExists',
  WeakPassword = 'WeakPassword',
  InvalidEmailOrPassword = 'InvalidEmailOrPassword',
  InvalidEmailOrPasswordOrVerificationCode = 'InvalidEmailOrPasswordOrVerificationCode',
  CouldNotVerifyEmail = 'CouldNotVerifyEmail',
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly verificationsService: VerificationsService,
    private readonly redis: RedisProvider,
  ) {}

  async signup({ email, password }: SignupDto): Promise<string> {
    const strength = testPassword(password);
    if (!strength.strong) {
      throw new ServiceError({
        message: strength.errors[0],
        name: AuthServiceErrors.WeakPassword,
      });
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      let user = await queryRunner.manager.findOne(User, { email });
      if (user) {
        throw new ServiceError({
          name: AuthServiceErrors.UserAlreadyExists,
        });
      }

      user = new User();
      user.email = email;
      await user.setPassword(password);

      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      await this.verificationsService.sendVerificationEmail(user.email);

      return this.jwtService.signAsync({ sub: user.id });
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async login({ email, password }: LoginDto): Promise<string> {
    const user = await this.usersRepository.findOne({ email });
    if (user && (await user.verifyPassword(password))) {
      if (user.isSmsTwoFa) {
        await this.verificationsService.sendVerificationSms(
          user.mobile,
          user.id,
        );
        return null;
      }
      return this.jwtService.signAsync({ sub: user.id });
    }
    throw new ServiceError({
      name: AuthServiceErrors.InvalidEmailOrPassword,
    });
  }

  async loginTwoFa({
    email,
    password,
    verificaitonCode,
  }: LoginTwoFaDto): Promise<string> {
    const user = await this.usersRepository.findOne({ email });
    if (user && (await user.verifyPassword(password))) {
      if (
        await this.verificationsService.verifySms(
          user.id,
          user.mobile,
          verificaitonCode,
        )
      ) {
        return this.jwtService.signAsync({ sub: user.id });
      }
    }
    throw new ServiceError({
      name: AuthServiceErrors.InvalidEmailOrPasswordOrVerificationCode,
    });
  }

  async verifyEmail({ token }: VerifyEmailDto): Promise<void> {
    const email = await this.verificationsService.verifyEmail(token);
    if (email) {
      const user = await this.usersRepository.findOne({
        email,
        isEmailVerified: false,
      });
      if (user) {
        user.isEmailVerified = true;
        await this.usersRepository.save(user);
      }
    }
    throw new ServiceError({
      name: AuthServiceErrors.CouldNotVerifyEmail,
    });
  }

  async logout({ jwt }: JwtDto): Promise<void> {
    const key = `invalid_jwt:${jwt}`;
    const value = this.jwtService.decode(jwt)['exp'];
    await this.redis.set(key, value);
    await this.redis.expireat(key, value);
  }
}
