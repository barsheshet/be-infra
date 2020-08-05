import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IoRedis from 'ioredis';

export enum RedisPrefix {
  Role = 'role',
  InvalidJwt = 'invalid_jwt',
  ApiHitLimit = 'api_hit_limit',
  TrustedDevice = 'trusted_device',
  BlockedUser = 'blocked_user',
  EmailVerification = 'email_verification',
  SmsVerification = 'email_verification',
  LoginFailIpPerDay = 'login_fail_ip_per_day',
  LoginFailConsecutiveUsernameAndIp = 'login_fail_consecutive_username_and_ip',
  LoginFailUsernamePerDay = 'login_fail_username_per_day',
  RefreshToken = 'refresh_token',
}

@Injectable()
export class RedisProvider extends IoRedis {
  constructor(configService: ConfigService) {
    super(configService.get<object>('redis'));
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
