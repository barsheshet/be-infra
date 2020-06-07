import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { VerificationsService } from './verifications.service';
import {
  UserDto,
  UserInfoDto,
  SetMobileDto,
  VerifyMobilelDto,
  SetEmailDto,
  SetSmsTwoFaDto,
} from '../dto/users.dto';
import { ServiceError } from '../../lib/service-error';

export enum UsersServiceErrors {
  UserDoesNotExists = 'UserDoesNotExists',
  CouldNotVerifyMobile = 'CouldNotVerifyMobile',
  UserAlreadyExists = 'UserAlreadyExists',
  MobileMustBeVerified = 'MobileMustBeVerified',
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private verificationsService: VerificationsService,
  ) {}

  private async getById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new ServiceError({
        name: UsersServiceErrors.UserDoesNotExists,
      });
    }
    return user;
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.getById(userId);
    return user.nonSensitive() as UserDto;
  }

  async updateUserInfo(userId: string, info: UserInfoDto): Promise<void> {
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
        name: UsersServiceErrors.CouldNotVerifyMobile,
      });
    }
  }

  async setEmail(userId: string, { email }: SetEmailDto): Promise<void> {
    const user = await this.getById(userId);
    if (user.email !== email || !user.isEmailVerified) {
      const exists = await this.usersRepository.findOne({ email });
      if (exists && exists.id !== user.id) {
        throw new ServiceError({
          name: UsersServiceErrors.UserAlreadyExists,
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
        name: UsersServiceErrors.MobileMustBeVerified,
      });
    }
    await this.usersRepository.save(user);
  }
}
