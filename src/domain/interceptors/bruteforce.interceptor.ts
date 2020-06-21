import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { catchError, map } from 'rxjs/operators';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import { ConfigService } from '@nestjs/config';
import * as hyperid from 'hyperid';

/**
 * Based on Roman Voloboev article
 * for more info: https://medium.com/@animirr/secure-web-applications-against-brute-force-b910263de2ab
 * */

@Injectable()
export class BruteforceInterceptor implements NestInterceptor {
  private limiterSlowBruteByIP;
  private limiterConsecutiveFailsByUsernameAndIP;
  private limiterSlowBruteByUsername;
  constructor(
    private readonly redis: RedisProvider,
    private readonly configService: ConfigService,
  ) {
    const rateLimitsConfig = this.configService.get('rateLimits');
    this.limiterSlowBruteByIP = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: RedisPrefix.LoginFailIpPerDay,
      ...rateLimitsConfig.slowBruteByIP,
    });

    this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: RedisPrefix.LoginFailConsecutiveUsernameAndIp,
      ...rateLimitsConfig.consecutiveFailsByUsernameAndIP,
    });

    this.limiterSlowBruteByUsername = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: RedisPrefix.LoginFailUsernamePerDay,
      ...rateLimitsConfig.slowBruteByUsername,
    });
  }

  private async checkDeviceWasUsedPreviously(
    username: string,
    deviceId: string,
  ): Promise<boolean> {
    return (
      deviceId &&
      !!(await this.redis.sismember(
        `${RedisPrefix.TrustedDevice}:${username}`,
        deviceId,
      ))
    );
  }

  private async trustDevice(username: string, deviceId: string): Promise<void> {
    await this.redis.sadd(`${RedisPrefix.TrustedDevice}${username}`, deviceId);
  }

  private getCurrentLimits(
    username: string,
    ip: string,
  ): Promise<[any, any, any]> {
    return Promise.all([
      this.limiterConsecutiveFailsByUsernameAndIP.get(`${username}_${ip}`),
      this.limiterSlowBruteByIP.get(ip),
      this.limiterSlowBruteByUsername.get(username),
    ]);
  }

  private async getRetrySecs(
    isDeviceTrusted: boolean,
    username: string,
    ip: string,
  ): Promise<number> {
    const [
      resUsernameAndIP,
      resSlowByIP,
      resSlowUsername,
    ] = await this.getCurrentLimits(username, ip);
    const rateLimitsConfig = this.configService.get('rateLimits');
    let retrySecs = 0;

    // Check if IP, Username + IP or Username is already blocked
    if (
      !isDeviceTrusted &&
      resSlowByIP !== null &&
      resSlowByIP.consumedPoints >= rateLimitsConfig.slowBruteByIP.points
    ) {
      retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (
      resUsernameAndIP !== null &&
      resUsernameAndIP.consumedPoints >=
        rateLimitsConfig.consecutiveFailsByUsernameAndIP.points
    ) {
      retrySecs = Number.MAX_SAFE_INTEGER;
    } else if (
      !isDeviceTrusted &&
      resSlowUsername !== null &&
      resSlowUsername.consumedPoints >=
        rateLimitsConfig.slowBruteByUsername.points
    ) {
      retrySecs = Number.MAX_SAFE_INTEGER;
    }

    return retrySecs;
  }

  private async consumePoints(
    isDeviceTrusted: boolean,
    username: string,
    ip: string,
  ): Promise<void> {
    const limiterPromises = [
      this.limiterConsecutiveFailsByUsernameAndIP.consume(`${username}_${ip}`),
    ];
    if (!isDeviceTrusted) {
      limiterPromises.push(this.limiterSlowBruteByIP.consume(ip));
      limiterPromises.push(this.limiterSlowBruteByUsername.consume(username));
    }

    await Promise.all(limiterPromises);
  }

  private async resetPoints(username: string, ip: string): Promise<void> {
    await this.limiterConsecutiveFailsByUsernameAndIP.delete(
      `${username}_${ip}`,
    );
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const ip = req.ip;
    const username = String(req.body?.email);
    const deviceIdCookieValue = String(req.cookies?.deviceId);

    const isDeviceTrusted = await this.checkDeviceWasUsedPreviously(
      username,
      deviceIdCookieValue,
    );

    const retrySecs = await this.getRetrySecs(isDeviceTrusted, username, ip);

    if (retrySecs > 0) {
      res.header('Retry-After', String(retrySecs));
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle().pipe(
      catchError(async error => {
        try {
          if (error instanceof UnauthorizedException) {
            await this.consumePoints(isDeviceTrusted, username, ip);
          }
          throw error;
        } catch (e) {
          if (e instanceof Error) {
            throw e;
          } else {
            // All available points are consumed from some/all limiters, block request
            throw new HttpException(
              'Too Many Requests',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        }
      }),
      map(async data => {
        if (data.jwt) {
          await this.resetPoints(username, ip);
          if (!isDeviceTrusted) {
            const uuid = hyperid({ urlSafe: true });
            const deviceId = uuid();
            res.setCookie('deviceId', deviceId, {
              ...this.configService.get('trustedDeviceCookieOptions'),
            });
            await this.trustDevice(username, deviceId);
          }
        }
        return data;
      }),
    );
  }
}
