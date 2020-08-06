import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { Utils } from '../../lib/utils';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  private cookieOptions;

  constructor(
    private readonly redis: RedisProvider,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.cookieOptions = this.configService.get('refreshTokenCookieOptions');
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    return next.handle().pipe(
      switchMap(async data => {
        if (data.jwt) {
          const refreshToken = Utils.generateToken();
          const userId = this.jwtService.decode(data.jwt).sub;
          const key = `${RedisPrefix.RefreshToken}:${userId}:${refreshToken}`;
          const expire = this.cookieOptions.maxAge;
          const refreshTokenExpiration = moment().utc().add(expire, 'seconds').format();
          await this.redis.setex(key, expire, refreshTokenExpiration);

          res.setCookie('refreshToken', refreshToken, {
            ...this.cookieOptions,
          });
        }
        return data;
      }),
    );
  }
}
