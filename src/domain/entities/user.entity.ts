import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as moment from 'moment';
import { hash, compare } from 'bcrypt';
import * as hyperid from 'hyperid';

const uuid = hyperid({ urlSafe: true });

class Info {
  firstName?: string;
  lastName?: string;
}

class Providers {}

type NonSensitive = Partial<Omit<User, 'password' & 'providers'>>;

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
  created: string;

  @Column({ name: 'updated' })
  updated: string;

  async setPassword(password): Promise<string> {
    this.password = await hash(password, 10);
    return this.password;
  }

  verifyPassword(password): Promise<boolean> {
    return compare(password, this.password);
  }

  nonSensitive(): NonSensitive {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, providers, ...rest } = this;
    return rest;
  }

  @BeforeInsert()
  setId() {
    this.id = uuid();
  }

  @BeforeInsert()
  setCreated() {
    this.created = moment()
      .utc()
      .format();
  }

  @BeforeUpdate()
  setUpdated() {
    this.updated = moment()
      .utc()
      .format();
  }
}
