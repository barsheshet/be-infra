import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User } from '../entities/user.entity';
import { VerificationsService } from './verifications.service';
import {
  UserDto,
  UserInfoDto,
  SetMobileDto,
  VerifyMobilelDto,
  SetEmailDto,
  SetSmsTwoFaDto,
  LoginTwoFaDto,
  VerifyEmailDto,
  JwtDto,
  CredentialsDto,
} from '../dto/account.dto';
import { ServiceError } from '../../lib/service-error';
import { JwtService } from '@nestjs/jwt';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import { test as testPassword } from 'owasp-password-strength-test';

export enum AccountServiceErrors {
  UserDoesNotExists = 'UserDoesNotExists',
  CouldNotVerifyMobile = 'CouldNotVerifyMobile',
  UserAlreadyExists = 'UserAlreadyExists',
  MobileMustBeVerified = 'MobileMustBeVerified',
  WeakPassword = 'WeakPassword',
  InvalidEmailOrPassword = 'InvalidEmailOrPassword',
  InvalidEmailOrPasswordOrVerificationCode = 'InvalidEmailOrPasswordOrVerificationCode',
  CouldNotVerifyEmail = 'CouldNotVerifyEmail',
}

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly verificationsService: VerificationsService,
    private readonly redis: RedisProvider,
  ) {}

  async signup({ email, password }: CredentialsDto): Promise<string> {
    const strength = testPassword(password);
    if (!strength.strong) {
      throw new ServiceError({
        message: strength.errors[0],
        name: AccountServiceErrors.WeakPassword,
      });
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      let user = await queryRunner.manager.findOne(User, { email });
      if (user) {
        throw new ServiceError({
          name: AccountServiceErrors.UserAlreadyExists,
        });
      }

      user = new User();
      user.email = email;
      await user.setPassword(password);

      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      await this.redis.set(`${RedisPrefix.Role}:${user.id}`, 'member');
      await this.verificationsService.sendVerificationEmail(user.email);

      return this.jwtService.signAsync({ sub: user.id });
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async login({ email, password }: CredentialsDto): Promise<string> {
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
      name: AccountServiceErrors.InvalidEmailOrPassword,
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
      name: AccountServiceErrors.InvalidEmailOrPasswordOrVerificationCode,
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
      name: AccountServiceErrors.CouldNotVerifyEmail,
    });
  }

  async logout({ jwt }: JwtDto): Promise<void> {
    const key = `${RedisPrefix.InvalidJwt}:${jwt}`;
    const value = this.jwtService.decode(jwt)['exp'];
    await this.redis.set(key, value);
    await this.redis.expireat(key, value);
  }

  private async getById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new ServiceError({
        name: AccountServiceErrors.UserDoesNotExists,
      });
    }
    return user;
  }

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.getById(userId);
    return user.nonSensitive() as UserDto;
  }

  async setInfo(userId: string, info: UserInfoDto): Promise<void> {
    const user = await this.getById(userId);
    user.info = Object.assign(user.info || {}, info);
    await this.usersRepository.save(user);
  }

  async setMobile(userId: string, { mobile }: SetMobileDto): Promise<void> {
    const user = await this.getById(userId);
    if (user.mobile !== mobile || !user.isMobileVerified) {
      user.mobile = mobile;
      user.isMobileVerified = false;
      await this.usersRepository.save(user);
      await this.verificationsService.sendVerificationSms(mobile, user.id);
    }
  }

  async verifyMobile(
    userId: string,
    { verificationCode }: VerifyMobilelDto,
  ): Promise<void> {
    const user = await this.getById(userId);
    if (
      await this.verificationsService.verifySms(
        user.id,
        user.mobile,
        verificationCode,
      )
    ) {
      user.isMobileVerified = true;
      await this.usersRepository.save(user);
    } else {
      throw new ServiceError({
        name: AccountServiceErrors.CouldNotVerifyMobile,
      });
    }
  }

  async setEmail(userId: string, { email }: SetEmailDto): Promise<void> {
    const user = await this.getById(userId);
    if (user.email !== email || !user.isEmailVerified) {
      const exists = await this.usersRepository.findOne({ email });
      if (exists && exists.id !== user.id) {
        throw new ServiceError({
          name: AccountServiceErrors.UserAlreadyExists,
        });
      }
      user.email = email;
      user.isEmailVerified = false;
      await this.usersRepository.save(user);
      await this.verificationsService.sendVerificationEmail(email);
    }
  }

  async setSmsTwoFa(
    userId: string,
    { smsTwoFa }: SetSmsTwoFaDto,
  ): Promise<void> {
    const user = await this.getById(userId);
    if (!smsTwoFa) {
      user.isSmsTwoFa = false;
    } else if (user.mobile && user.isMobileVerified) {
      user.isSmsTwoFa = true;
    } else {
      throw new ServiceError({
        name: AccountServiceErrors.MobileMustBeVerified,
      });
    }
    await this.usersRepository.save(user);
  }
}
