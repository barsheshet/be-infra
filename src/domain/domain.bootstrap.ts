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

  async seedUser(data: {
    email: string;
    password: string;
    role: string;
    info: { 
      firstName: string; 
      lastName: string;
    }
  }): Promise<void> {
    let user = await this.usersRepository.findOne({ email: data.email });
    if (!user) {
      user = new User();
      user.email = data.email;
      user.isEmailVerified = true;
      user.role = data.role;
      user.info = data.info;
      await user.setPassword(data.password);
      await this.usersRepository.save(user);
    }
  }
}
