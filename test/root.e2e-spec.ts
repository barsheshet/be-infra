import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { execSync } from 'child_process';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    execSync('docker-compose -f ./test/docker-compse.yml up -d');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    const connection = getConnection();
    await connection.runMigrations();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    execSync('docker rm -vf be-infra-test-pg');
  });

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('/config (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/config');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      host: 'http://localhost:3000',
      nodeEnv: 'test',
      port: 3000,
    });
  });

  it('/api/v1/auth/signup (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'bla@bla.com',
        password: 'Aa123456789!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'Complete',
      data: { jwt: expect.stringMatching('') },
    });
  });
});
