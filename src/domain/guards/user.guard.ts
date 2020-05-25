import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/users.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token: string = request.headers.authorization;
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
      }
      try {
        const { sub } = await this.jwtService.verifyAsync(token);
        const user = await this.usersService.getUserById(sub);
        request.user = user.nonSensitive();
      } catch (e) {
        return true;
      }
    }
    return true;
  }
}
