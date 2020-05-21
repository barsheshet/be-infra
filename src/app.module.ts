import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RootController } from './root.controller';
import { RootService } from './root.service';
import { config, envSchema } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [config],
      envFilePath: ['.env', '.local.env'],
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get<object>('db'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [RootController],
  providers: [
    RootService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
