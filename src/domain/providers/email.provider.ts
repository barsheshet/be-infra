import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiClient } from '../../lib/api-client';

export enum ContentType {
  TEXT = 'text/plain',
  HTML = 'text/html',
}

type Content = {
  type: ContentType;
  value: string;
};

interface SendSingleEmailOptions {
  to: string;
  from?: string;
  subject: string;
  content: Content;
}

type Config = {
  apiKey: string;
  host: string;
  defaultFrom: string;
};

@Injectable()
export class EmailProvider extends ApiClient {
  private config: Config;
  constructor(private readonly configService: ConfigService) {
    super();
    this.config = this.configService.get('sendgrid');
    this.init({
      baseURL: this.config.host,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });
  }

  async sendSingleEmail(options: SendSingleEmailOptions): Promise<void> {
    await this.api({
      method: 'POST',
      url: '/mail/send',
      data: {
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: { email: options.from || this.config.defaultFrom },
        subject: options.subject,
        content: [options.content],
      },
    });
  }
}
