import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, Connection } from 'typeorm';

@Injectable()
export class DomainBootstrap implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly connection: Connection,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.connection.runMigrations();
    Logger.log('Run migrations', DomainBootstrap.name);

    const seedConfig = this.configService.get('seed');
    await this.seedUser(seedConfig.systemAdmin);
    await this.seedUser(seedConfig.testUser);
    Logger.log('Run seeds', DomainBootstrap.name);
  }

  async seedUser(creds: { email: string; password: string }): Promise<void> {
    let user = await this.usersRepository.findOne({ email: creds.email });
    if (!user) {
      user = new User();
      user.email = creds.email;
      user.isEmailVerified = true;
      await user.setPassword(creds.password);
      await this.usersRepository.save(user);
    }
  }
}
