import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utils } from '../../lib/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const jwt = Utils.parseAutorizationHeader(request.headers.authorization);

      const { sub, role } = await this.jwtService.verifyAsync(jwt);

      request.user = {
        id: sub,
        role  
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
