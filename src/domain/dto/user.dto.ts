import { UserInfoDto } from './user-info.dto';
export class UserDto {
  id: string;
  email: string;
  mobile: string;
  isSmsTwoFa: boolean;
  info: UserInfoDto;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.mobile = user.mobile;
    this.info = user.info;
    this.isEmailVerified = user.isEmailVerified;
    this.isMobileVerified = user.isMobileVerified;
    this.isSmsTwoFa = user.isSmsTwoFa;
  }
}
