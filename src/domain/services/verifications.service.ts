import { Injectable } from '@nestjs/common';
import { EmailProvider, ContentType } from '../providers/email.provider';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from '../providers/sms.provider';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import { Utils } from '../../lib/utils';
import * as moment from 'moment';

type VerificationConfig = {
  url?: string;
  expiration: object;
};

type Config = {
  email: VerificationConfig;
  sms: VerificationConfig;
};

@Injectable()
export class VerificationsService {
  private config: Config;
  constructor(
    private readonly configService: ConfigService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    private readonly redis: RedisProvider,
  ) {
    this.config = this.configService.get('verifications');
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const token = Utils.generateToken();
    const key = `${RedisPrefix.EmailVerification}:${token}`;

    await this.redis.set(key, email);

    const expiration = moment()
      .utc()
      .add(this.config.email.expiration)
      .unix();
    await this.redis.expireat(key, expiration);

    const Url = new URL(`${this.config.email.url}`);
    Url.searchParams.append('token', token);
    
    return this.emailProvider.sendSingleEmail({
      subject: 'Verify Your Email Address',
      to: email,
      content: {
        type: ContentType.HTML,
        value: `<p>click <a href=${Url.href}>here</a> to verify your email address</p>`,
      },
    });
  }

  async sendVerificationSms(mobile: string, userId: string): Promise<void> {
    const verificationCode = Utils.generateVerificationCode();
    const key = `${RedisPrefix.SmsVerification}:${mobile}`;
    const value = JSON.stringify({
      userId,
      verificationCode,
    });
    await this.redis.set(key, value);

    const expiration = moment()
      .utc()
      .add(this.config.sms.expiration)
      .unix();
    await this.redis.expireat(key, expiration);

    return this.smsProvider.sendSingleSms({
      to: mobile,
      content: `Your verification code is: ${verificationCode}`,
    });
  }

  async verifyEmail(token: string): Promise<string> {
    const key = `${RedisPrefix.EmailVerification}:${token}`;
    return this.redis.get(key);
  }

  async verifySms(
    userId: string,
    mobile: string,
    verificationCode: string,
  ): Promise<boolean> {
    const key = `${RedisPrefix.SmsVerification}:${mobile}`;
    const value = await this.redis.get(key);
    if (value) {
      const parsed = JSON.parse(value);
      if (
        parsed.userId === userId &&
        parsed.verificationCode === verificationCode
      ) {
        return true;
      }
    }
    return false;
  }
}
