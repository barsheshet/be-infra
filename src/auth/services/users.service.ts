import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User } from '../entities/user.entity';
import { CredentialsDto } from '../auth.dto';
import { test as testPassword } from 'owasp-password-strength-test';

export enum UsersServiceErrors {
  UserAlreadyExists = 'UserAlreadyExists',
  WeakPassword = 'WeakPassword',
  InvalidEmailOrPassword = 'InvalidEmailOrPassword'
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private connection: Connection,
  ) {}

  async register(creds: CredentialsDto): Promise<User> {
    const strength = testPassword(creds.password);
    if (!strength.strong) {
      const err = new Error(strength.errors[0]);
      err.name = UsersServiceErrors.WeakPassword;
      throw err;
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      let user = await queryRunner.manager.findOne(User, {
        email: creds.email,
      });
      if (user) {
        const err = new Error();
        err.name = UsersServiceErrors.UserAlreadyExists;
        throw err;
      }

      user = new User();
      user.email = creds.email;

      await user.setPassword(creds.password);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return user;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async validateUser(creds: CredentialsDto): Promise<User> {
    const user = await this.usersRepository.findOne({email: creds.email});
    if (user && await user.verifyPassword(creds.password)) {
      return user;
    }
    const err = new Error();
    err.name = UsersServiceErrors.InvalidEmailOrPassword;
    throw err;
  }

  getUserById(id: string): Promise<User> {
    return this.usersRepository.findOne(id);
  }
}
