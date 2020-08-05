import * as hyperid from 'hyperid';
import * as crypto from 'crypto';

export class Utils {
  static parseAutorizationHeader(value: string): string {
    let token = String(value);
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    return token;
  }

  static generateToken() {
    const uuid = hyperid({ urlSafe: true });
    return uuid();
  }

  static generateVerificationCode() {
    return crypto
      .randomBytes(32)
      .readBigUInt64BE()
      .toString()
      .substring(4, 10);
  }
}
