import { readFileSync } from 'fs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './services/users.service';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { RedisProvider } from './providers/redis.provider';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { VerificationsService } from './services/verifications.service';
import { AuthService } from './services/auth.service';
import { DomainBootstrap } from './domain.bootstrap';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.get('jwt');
        const privateKey = readFileSync(jwtConfig.privateKeyPath, 'utf8');
        const publicKey = readFileSync(jwtConfig.publicKeyPath, 'utf8');
        const options = jwtConfig.options;
        return {
          privateKey,
          publicKey,
          verifyOptions: options,
          signOptions: options,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    UsersService,
    DomainBootstrap,
    AuthService,
    VerificationsService,
    RedisProvider,
    EmailProvider,
    SmsProvider,
  ],
  controllers: [AuthController, UsersController],
  exports: [TypeOrmModule, UsersService, AuthService, VerificationsService, JwtModule],
})
export class DomainModule {}
