export class Utils {
  static parseAutorizationHeader(value: string): string {
    let token = String(value);
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    return token;
  }
}
