import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('API auth (e2e)', () => {
  let app: INestApplication;
  let server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/signup (POST)', async () => {
    const response = await request(server)
      .post('/api/v1/auth/signup')
      .send({
        email: 'bla@bla.com',
        password: 'Aa123456789!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      jwt: expect.stringMatching('')
    });
  });

  it('/api/v1/auth/login (POST)', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'bla@bla.com',
        password: 'Aa123456789!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      jwt: expect.stringMatching('')
    });
  });
});
