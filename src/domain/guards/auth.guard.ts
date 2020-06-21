import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import { Utils } from '../../lib/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const jwt = Utils.parseAutorizationHeader(request.headers.authorization);
      if (await this.redis.get(`${RedisPrefix.InvalidJwt}:${jwt}`)) {
        throw new Error();
      }
      const { sub } = await this.jwtService.verifyAsync(jwt);
      if (await this.redis.get(`${RedisPrefix.BlockedUser}:${sub}`)) {
        throw new Error();
      }
      request.userId = sub;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
