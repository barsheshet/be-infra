import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  getStatus(): string {
    return 'OK';
  }

  getConfig(): object {
    return {
      host: this.configService.get<string>('host'),
      port: this.configService.get<number>('port'),
      nodeEnv: this.configService.get<string>('nodeEnv'),
    };
  }
}
