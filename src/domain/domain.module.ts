import { readFileSync } from 'fs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './services/users.service';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { RateLimiterStoreProvider } from './providers/rate-limiter-store.provider';

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
  providers: [UsersService, RateLimiterStoreProvider],
  controllers: [AuthController, UsersController],
  exports: [TypeOrmModule, UsersService, JwtModule],
})
export class DomainModule {}
