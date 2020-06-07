import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as querystring from 'querystring';
import { ApiClient } from '../../lib/api-client';

interface SendSingleSmsOptions {
  to: string;
  from?: string;
  content: string;
}

type Config = {
  host: string;
  accountSid: string;
  authToken: string;
  defaultFrom: string;
};

@Injectable()
export class SmsProvider extends ApiClient {
  private config: Config;
  constructor(private readonly configService: ConfigService) {
    super();
    this.config = this.configService.get('twilio');
    this.init({
      baseURL: `${this.config.host}/Accounts/${this.config.accountSid}`,
      auth: {
        username: this.config.accountSid,
        password: this.config.authToken,
      },
    });
  }

  async sendSingleSms(options: SendSingleSmsOptions): Promise<void> {
    await this.api({
      method: 'POST',
      url: '/Messages.json',
      data: querystring.stringify({
        Body: options.content,
        From: options.from ?? this.config.defaultFrom,
        To: options.to,
      }),
    });
  }
}
