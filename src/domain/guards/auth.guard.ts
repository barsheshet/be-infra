import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = String(request.headers.authorization);
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
      }
      try {
        const { sub } = await this.jwtService.verifyAsync(token);
        request.userId = sub;
        return true;
      } catch (e) {
        throw new UnauthorizedException();
      }
    }
    throw new UnauthorizedException();
  }
}
