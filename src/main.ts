import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { getConnection } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(), // todo { logger: process.env.NODE_ENV === 'development' }
  );

  const configService = app.get(ConfigService);

  app.enableCors();
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('be-infra')
    .setDescription('API documentation for be-infra')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('port');

  Logger.log('Running migrations...', 'Mirgations');
  const connection = getConnection();
  await connection.runMigrations();
  Logger.log('Migration done', 'Mirgations');

  await app.listen(port);
}
bootstrap();
