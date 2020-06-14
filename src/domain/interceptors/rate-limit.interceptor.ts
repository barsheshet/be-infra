import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisProvider } from '../providers/redis.provider';
import { ConfigService } from '@nestjs/config';
import { RateLimiterRedis } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private rateLimiter;
  constructor(
    private readonly redis: RedisProvider,
    private readonly configService: ConfigService,
  ) {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      ...this.configService.get('rateLimits.global'),
    });
  }
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const key = req.userId ? req.userId : req.ip;
    const pointsToConsume = req.userId ? 1 : 30;
    try {
      await this.rateLimiter.consume(key, pointsToConsume);
    } catch (e) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
