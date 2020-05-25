export enum CommandStatus {
  Complete = 'Complete',
  Failed = 'Failed',
}

export class Jwt {
  jwt: string;
}

export class CommandResponse {
  status: CommandStatus;
}

export class SignUpResponse extends CommandResponse {
  data: Jwt;
}

export class LoginResponse extends CommandResponse {
  data: Jwt;
}
