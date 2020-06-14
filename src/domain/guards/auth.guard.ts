import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisProvider } from '../providers/redis.provider';
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
      if (await this.redis.get(`invalid_jwt:${jwt}`)) {
        throw new Error();
      }
      const { sub } = await this.jwtService.verifyAsync(jwt);
      request.userId = sub;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
