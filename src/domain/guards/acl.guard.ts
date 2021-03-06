import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Ability, ForbiddenError } from '@casl/ability';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AclGuard implements CanActivate {
  private abilities = {};
  constructor(
    private readonly config: ConfigService,
  ) {
    const aclConfig = this.config.get('acl');
    for (const key in aclConfig) {
      this.abilities[key] = new Ability(aclConfig[key]);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const role = request.user.role;
      ForbiddenError.from(this.abilities[role]).throwUnlessCan(
        request.raw.method,
        request.raw.url,
      );
      return true;
    } catch (e) {
      if (e instanceof ForbiddenError) {
        throw new ForbiddenException(e.message);
      }
      throw e;
    }
  }
}
