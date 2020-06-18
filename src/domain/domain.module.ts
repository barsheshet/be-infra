import { readFileSync } from 'fs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccountService } from './services/account.service';
import { AccountController } from './controllers/account.controller';
import { User } from './entities/user.entity';
import { RedisProvider } from './providers/redis.provider';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { VerificationsService } from './services/verifications.service';
import { DomainBootstrap } from './domain.bootstrap';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';

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
    DomainBootstrap,
    VerificationsService,
    RedisProvider,
    EmailProvider,
    SmsProvider,
    AccountService,
    VerificationsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
  controllers: [AccountController],
  exports: [TypeOrmModule],
})
export class DomainModule {}
