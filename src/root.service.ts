import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigDto } from './root.dto';

@Injectable()
export class RootService {
  constructor(private configService: ConfigService) {}
  getStatus(): string {
    return 'OK';
  }

  getConfig(): ConfigDto {
    return {
      host: this.configService.get<string>('host'),
      port: this.configService.get<number>('port'),
      environment: this.configService.get<string>('nodeEnv'),
    };
  }
}
