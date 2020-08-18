import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
//import * as helmet from 'fastify-helmet';
import * as fastifyCookie from 'fastify-cookie';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.register(fastifyCookie as any);

  // TODO: configure helmet to work  
  //fastifyAdapter.register(helmet);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter, // TODO: { logger: process.env.NODE_ENV === 'development' }
  );

  const configService = app.get(ConfigService);

  app.enableCors(configService.get('cors'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('be-infra')
    .setDescription('API documentation for be-infra')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('port');

  await app.listen(port);
}
bootstrap();
