import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as fastifyCookie from 'fastify-cookie';

export async function getMockServer() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.register(fastifyCookie);

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    fastifyAdapter,
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  return app.init();
}
