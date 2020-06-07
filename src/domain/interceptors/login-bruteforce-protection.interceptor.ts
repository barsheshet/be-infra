import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { RedisProvider } from '../providers/redis.provider';
import { ConfigService } from '@nestjs/config';

type LimitConfig = {
  points: number;
  duration: number;
  blockDuration: number;
};

type Config = {
  loginSlowBruteByIP: LimitConfig;
  loginConsecutiveFailsByUsernameAndIP: LimitConfig;
};

@Injectable()
export class LoginBruteforceProtectionInterceptor implements NestInterceptor {
  private config: Config;
  private limiterSlowBruteByIP;
  private limiterConsecutiveFailsByUsernameAndIP;

  constructor(
    private configService: ConfigService,
    private redis: RedisProvider,
  ) {
    this.config = this.configService.get<Config>('rateLimits');
    this.limiterSlowBruteByIP = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'login_fail_ip',
      ...this.config.loginSlowBruteByIP,
    });

    this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'login_fail_consecutive_username_and_ip',
      ...this.config.loginConsecutiveFailsByUsernameAndIP,
    });
  }

  getUsernameIPkey(username, ip) {
    return `${username}_${ip}`;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const ipAddr = request.ip;
    const usernameIPkey = this.getUsernameIPkey(request.body.email, ipAddr);

    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
      this.limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
      this.limiterSlowBruteByIP.get(ipAddr),
    ]);

    let retrySecs = 0;
    const maxWrongAttemptsByIPperDay = this.config.loginSlowBruteByIP.points;
    const maxConsecutiveFailsByUsernameAndIP = this.config
      .loginConsecutiveFailsByUsernameAndIP.points;

    // Check if IP or Username + IP is already blocked
    if (
      resSlowByIP !== null &&
      resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
    ) {
      retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (
      resUsernameAndIP !== null &&
      resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP
    ) {
      retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }

    if (retrySecs > 0) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    } else {
      return next.handle().pipe(
        catchError(async err => {
          try {
            const promises = [
              this.limiterSlowBruteByIP.consume(ipAddr),
              this.limiterConsecutiveFailsByUsernameAndIP.consume(
                usernameIPkey,
              ),
            ];

            await Promise.all(promises);

            throw err;
          } catch (rlRejected) {
            if (rlRejected instanceof Error) {
              throw rlRejected;
            } else {
              throw new HttpException(
                'Too many requests',
                HttpStatus.TOO_MANY_REQUESTS,
              );
            }
          }
        }),
        tap(async () => {
          if (
            resUsernameAndIP !== null &&
            resUsernameAndIP.consumedPoints > 0
          ) {
            // Reset on successful authorisation
            await this.limiterConsecutiveFailsByUsernameAndIP.delete(
              usernameIPkey,
            );
          }
        }),
      );
    }
  }
}
