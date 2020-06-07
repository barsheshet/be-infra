import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RootController } from './root.controller';
import { RootService } from './root.service';
import { config, envSchema } from './config/configuration';
import { DomainModule } from './domain/domain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [config],
      envFilePath: ['.env', `${process.env.NODE_ENV}.env`],
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get<object>('db'),
      }),
      inject: [ConfigService],
    }),
    DomainModule,
  ],
  controllers: [RootController],
  providers: [RootService],
})
export class AppModule {}
