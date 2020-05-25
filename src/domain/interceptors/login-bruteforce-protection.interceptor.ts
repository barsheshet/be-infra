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
import { RateLimiterStoreProvider } from '../providers/rate-limiter-store.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginBruteforceProtectionInterceptor implements NestInterceptor {
  private rateLimitsConfig;
  private limiterSlowBruteByIP;
  private limiterConsecutiveFailsByUsernameAndIP;

  constructor(
    private configService: ConfigService,
    private rateLimiterStore: RateLimiterStoreProvider,
  ) {
    this.rateLimitsConfig = this.configService.get<object>('rateLimits');
    this.limiterSlowBruteByIP = new RateLimiterRedis({
      storeClient: this.rateLimiterStore.store,
      keyPrefix: 'login_fail_ip',
      ...this.rateLimitsConfig.loginSlowBruteByIP,
    });

    this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
      storeClient: this.rateLimiterStore.store,
      keyPrefix: 'login_fail_consecutive_username_and_ip',
      ...this.rateLimitsConfig.loginConsecutiveFailsByUsernameAndIP,
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
    const maxWrongAttemptsByIPperDay = this.rateLimitsConfig.slowBruteByIP
      .points;
    const maxConsecutiveFailsByUsernameAndIP = this.rateLimitsConfig
      .consecutiveFailsByUsernameAndIP.points;

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
      return next
        .handle()
        .pipe(
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
        )
        .pipe(
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
