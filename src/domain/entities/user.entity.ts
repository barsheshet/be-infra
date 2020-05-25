import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { hash, compare } from 'bcrypt';
import * as Hyperid from 'hyperid';

const hyperid = Hyperid({ urlSafe: true });

class Info {
  firstName?: string;
  lastName?: string;
}

class Providers {}

type NonSensitive = Partial<Omit<User, 'password'>>;

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ name: 'id' })
  id: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'mobile' })
  mobile: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'is_sms_two_fa', type: 'boolean' })
  isSmsTwoFa = false;

  @Column({ name: 'info', type: 'jsonb' })
  info: Info;

  @Column({ name: 'is_email_verified', type: 'boolean' })
  isEmailVerified = false;

  @Column({ name: 'is_mobile_verified', type: 'boolean' })
  isMobileVerified = false;

  @Column({ name: 'providers', type: 'jsonb' })
  providers: Providers;

  @Column({ name: 'created' })
  created: Date;

  @Column({ name: 'updated' })
  updated: Date;

  @Column({ name: 'deleted' })
  deleted: Date;

  async setPassword(password): Promise<string> {
    this.password = await hash(password, 10);
    return this.password;
  }

  verifyPassword(password): Promise<boolean> {
    return compare(password, this.password);
  }

  nonSensitive(): NonSensitive {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = this;
    return rest;
  }

  @BeforeInsert()
  setId() {
    this.id = hyperid();
  }

  @BeforeInsert()
  setCreated() {
    this.created = new Date();
  }

  @BeforeUpdate()
  setUodated() {
    this.created = new Date();
  }
}
