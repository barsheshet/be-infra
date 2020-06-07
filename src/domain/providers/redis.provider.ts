import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IoRedis from 'ioredis';

@Injectable()
export class RedisProvider extends IoRedis {
  constructor(configService: ConfigService) {
    super(configService.get<object>('redis'));
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
