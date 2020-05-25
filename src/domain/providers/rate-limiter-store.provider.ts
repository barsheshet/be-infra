import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Injectable()
export class RateLimiterStoreProvider {
  readonly _client;

  constructor(private configService: ConfigService) {
    this._client = new Redis({
      connectionName: 'be-infra-rate-limiter',
      connectTimeout: 500,
      maxRetriesPerRequest: 1,
      ...this.configService.get<object>('redis'),
    });
  }

  get store() {
    return this._client;
  }

  onModuleDestroy() {
    this._client.disconnect();
  }
}
